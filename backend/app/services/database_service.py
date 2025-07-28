from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from app.models.database import User, Project, Dataset, Analysis, Figure, ProjectCollaborator
from app.core.database import get_db_sync


class UserService:
    """Service for user-related database operations"""
    
    @staticmethod
    def create_user(db: Session, email: str, name: str = None, **kwargs) -> User:
        """Create a new user"""
        # Convert string UUID to UUID object if provided
        if 'id' in kwargs and isinstance(kwargs['id'], str):
            import uuid as uuid_lib
            kwargs['id'] = uuid_lib.UUID(kwargs['id'])
        
        user = User(
            email=email,
            name=name,
            **kwargs
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get user by email"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def update_user(db: Session, user_id: str, **kwargs) -> Optional[User]:
        """Update user information"""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            for key, value in kwargs.items():
                setattr(user, key, value)
            db.commit()
            db.refresh(user)
        return user
    
    @staticmethod
    def update_last_login(db: Session, user_id: str) -> None:
        """Update user's last login time"""
        db.query(User).filter(User.id == user_id).update(
            {User.last_login: datetime.utcnow()}
        )
        db.commit()


class ProjectService:
    """Service for project-related database operations"""
    
    @staticmethod
    def create_project(db: Session, user_id: str, name: str, description: str = None, **kwargs) -> Project:
        """Create a new project"""
        project = Project(
            user_id=user_id,
            name=name,
            description=description,
            **kwargs
        )
        db.add(project)
        db.commit()
        db.refresh(project)
        return project
    
    @staticmethod
    def get_project(db: Session, project_id: str) -> Optional[Project]:
        """Get project by ID"""
        return db.query(Project).filter(Project.id == project_id).first()
    
    @staticmethod
    def get_user_projects(db: Session, user_id: str, limit: int = 50, offset: int = 0, search: str = None) -> List[Project]:
        """Get all projects for a user with pagination and search"""
        query = db.query(Project).filter(Project.user_id == user_id)
        
        if search:
            query = query.filter(
                Project.name.ilike(f"%{search}%") | 
                Project.description.ilike(f"%{search}%")
            )
        
        return query.order_by(desc(Project.updated_at)).offset(offset).limit(limit).all()
    
    @staticmethod
    def count_user_projects(db: Session, user_id: str, search: str = None) -> int:
        """Count total projects for a user with optional search"""
        query = db.query(Project).filter(Project.user_id == user_id)
        
        if search:
            query = query.filter(
                Project.name.ilike(f"%{search}%") | 
                Project.description.ilike(f"%{search}%")
            )
        
        return query.count()
    
    @staticmethod
    def update_project(db: Session, project_id: str, **kwargs) -> Optional[Project]:
        """Update project information"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            for key, value in kwargs.items():
                setattr(project, key, value)
            project.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(project)
        return project
    
    @staticmethod
    def delete_project(db: Session, project_id: str) -> bool:
        """Delete a project and all associated data"""
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            db.delete(project)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_project_stats(db: Session, project_id: str) -> Dict[str, Any]:
        """Get project statistics"""
        datasets_count = db.query(Dataset).filter(Dataset.project_id == project_id).count()
        analyses_count = db.query(Analysis).join(Dataset).filter(Dataset.project_id == project_id).count()
        figures_count = db.query(Figure).join(Analysis).join(Dataset).filter(Dataset.project_id == project_id).count()
        
        return {
            "datasets": datasets_count,
            "analyses": analyses_count,
            "figures": figures_count
        }


class DatasetService:
    """Service for dataset-related database operations"""
    
    @staticmethod
    def create_dataset(db: Session, project_id: str, filename: str, file_path: str, 
                      file_size: int, metadata: Dict[str, Any], **kwargs) -> Dataset:
        """Create a new dataset"""
        dataset = Dataset(
            project_id=project_id,
            filename=filename,
            file_path=file_path,
            file_size=file_size,
            n_rows=metadata.get('n_rows'),
            n_columns=metadata.get('n_columns'),
            column_metadata=metadata,
            expires_at=datetime.utcnow() + timedelta(days=90),  # 90-day retention
            **kwargs
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        return dataset
    
    @staticmethod
    def get_dataset(db: Session, dataset_id: str) -> Optional[Dataset]:
        """Get dataset by ID"""
        return db.query(Dataset).filter(Dataset.id == dataset_id).first()
    
    @staticmethod
    def get_project_datasets(db: Session, project_id: str) -> List[Dataset]:
        """Get all datasets for a project"""
        return db.query(Dataset).filter(
            Dataset.project_id == project_id
        ).order_by(desc(Dataset.uploaded_at)).all()
    
    @staticmethod
    def update_dataset_metadata(db: Session, dataset_id: str, metadata: Dict[str, Any]) -> Optional[Dataset]:
        """Update dataset metadata"""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            dataset.column_metadata = metadata
            dataset.n_rows = metadata.get('n_rows', dataset.n_rows)
            dataset.n_columns = metadata.get('n_columns', dataset.n_columns)
            db.commit()
            db.refresh(dataset)
        return dataset
    
    @staticmethod
    def delete_dataset(db: Session, dataset_id: str) -> bool:
        """Delete a dataset"""
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if dataset:
            db.delete(dataset)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_expired_datasets(db: Session) -> List[Dataset]:
        """Get datasets that have expired and should be cleaned up"""
        return db.query(Dataset).filter(
            Dataset.expires_at < datetime.utcnow()
        ).all()


class AnalysisService:
    """Service for analysis-related database operations"""
    
    @staticmethod
    def create_analysis(db: Session, dataset_id: str, analysis_type: str, 
                       parameters: Dict[str, Any], results: Dict[str, Any], **kwargs) -> Analysis:
        """Create a new analysis"""
        analysis = Analysis(
            dataset_id=dataset_id,
            analysis_type=analysis_type,
            parameters=parameters,
            results=results,
            execution_time_ms=kwargs.get('execution_time_ms'),
            assumptions_checked=kwargs.get('assumptions_checked', {}),
            warnings=kwargs.get('warnings', {}),
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        return analysis
    
    @staticmethod
    def get_analysis(db: Session, analysis_id: str) -> Optional[Analysis]:
        """Get analysis by ID"""
        return db.query(Analysis).filter(Analysis.id == analysis_id).first()
    
    @staticmethod
    def get_dataset_analyses(db: Session, dataset_id: str) -> List[Analysis]:
        """Get all analyses for a dataset"""
        return db.query(Analysis).filter(
            Analysis.dataset_id == dataset_id
        ).order_by(desc(Analysis.created_at)).all()
    
    @staticmethod
    def get_user_analyses(db: Session, user_id: str, limit: int = 50) -> List[Analysis]:
        """Get all analyses for a user"""
        return db.query(Analysis).join(Dataset).join(Project).filter(
            Project.user_id == user_id
        ).order_by(desc(Analysis.created_at)).limit(limit).all()
    
    @staticmethod
    def update_analysis_results(db: Session, analysis_id: str, results: Dict[str, Any]) -> Optional[Analysis]:
        """Update analysis results"""
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.results = results
            db.commit()
            db.refresh(analysis)
        return analysis


class FigureService:
    """Service for figure-related database operations"""
    
    @staticmethod
    def create_figure(db: Session, analysis_id: str, figure_type: str, file_path: str,
                     style_preset: str = "nature", **kwargs) -> Figure:
        """Create a new figure"""
        figure = Figure(
            analysis_id=analysis_id,
            figure_type=figure_type,
            style_preset=style_preset,
            file_path=file_path,
            dpi=kwargs.get('dpi', 300),
            format=kwargs.get('format', 'png'),
            custom_styling=kwargs.get('custom_styling', {}),
        )
        db.add(figure)
        db.commit()
        db.refresh(figure)
        return figure
    
    @staticmethod
    def get_figure(db: Session, figure_id: str) -> Optional[Figure]:
        """Get figure by ID"""
        return db.query(Figure).filter(Figure.id == figure_id).first()
    
    @staticmethod
    def get_analysis_figures(db: Session, analysis_id: str) -> List[Figure]:
        """Get all figures for an analysis"""
        return db.query(Figure).filter(
            Figure.analysis_id == analysis_id
        ).order_by(desc(Figure.created_at)).all()
    
    @staticmethod
    def get_latest_figure(db: Session, analysis_id: str) -> Optional[Figure]:
        """Get the most recent figure for an analysis"""
        return db.query(Figure).filter(
            Figure.analysis_id == analysis_id
        ).order_by(desc(Figure.created_at)).first()
    
    @staticmethod
    def delete_figure(db: Session, figure_id: str) -> bool:
        """Delete a figure"""
        figure = db.query(Figure).filter(Figure.id == figure_id).first()
        if figure:
            db.delete(figure)
            db.commit()
            return True
        return False


class CollaborationService:
    """Service for collaboration-related database operations"""
    
    @staticmethod
    def add_collaborator(db: Session, project_id: str, user_id: str, role: str = "viewer") -> ProjectCollaborator:
        """Add a collaborator to a project"""
        collaborator = ProjectCollaborator(
            project_id=project_id,
            user_id=user_id,
            role=role
        )
        db.add(collaborator)
        db.commit()
        db.refresh(collaborator)
        return collaborator
    
    @staticmethod
    def get_project_collaborators(db: Session, project_id: str) -> List[ProjectCollaborator]:
        """Get all collaborators for a project"""
        return db.query(ProjectCollaborator).filter(
            ProjectCollaborator.project_id == project_id
        ).all()
    
    @staticmethod
    def get_user_collaborations(db: Session, user_id: str) -> List[ProjectCollaborator]:
        """Get all projects where user is a collaborator"""
        return db.query(ProjectCollaborator).filter(
            ProjectCollaborator.user_id == user_id
        ).all()
    
    @staticmethod
    def update_collaborator_role(db: Session, project_id: str, user_id: str, role: str) -> Optional[ProjectCollaborator]:
        """Update collaborator role"""
        collaborator = db.query(ProjectCollaborator).filter(
            and_(ProjectCollaborator.project_id == project_id,
                 ProjectCollaborator.user_id == user_id)
        ).first()
        if collaborator:
            collaborator.role = role
            db.commit()
            db.refresh(collaborator)
        return collaborator
    
    @staticmethod
    def remove_collaborator(db: Session, project_id: str, user_id: str) -> bool:
        """Remove a collaborator from a project"""
        collaborator = db.query(ProjectCollaborator).filter(
            and_(ProjectCollaborator.project_id == project_id,
                 ProjectCollaborator.user_id == user_id)
        ).first()
        if collaborator:
            db.delete(collaborator)
            db.commit()
            return True
        return False


# Convenience functions for quick database operations
def get_or_create_user(email: str, name: str = None) -> User:
    """Get existing user or create new one"""
    db = get_db_sync()
    try:
        user = UserService.get_user_by_email(db, email)
        if not user:
            user = UserService.create_user(db, email, name)
        return user
    finally:
        db.close()


def create_sample_data():
    """Create sample data for testing (run once)"""
    db = get_db_sync()
    try:
        # Create sample user
        user = get_or_create_user("researcher@example.com", "Dr. Sample Researcher")
        
        # Create sample project
        project = ProjectService.create_project(
            db, user.id, 
            name="Clinical Trial Analysis",
            description="Analysis of drug efficacy data"
        )
        
        # Create sample dataset
        sample_metadata = {
            "n_rows": 150,
            "n_columns": 5,
            "columns": [
                {"name": "patient_id", "type": "categorical", "role": "identifier"},
                {"name": "group", "type": "categorical", "role": "group"},
                {"name": "outcome", "type": "continuous", "role": "outcome"},
                {"name": "age", "type": "continuous", "role": "covariate"},
                {"name": "gender", "type": "categorical", "role": "covariate"}
            ]
        }
        
        dataset = DatasetService.create_dataset(
            db, project.id,
            filename="clinical_trial_data.csv",
            file_path="/uploads/sample_data.csv",
            file_size=12045,
            metadata=sample_metadata
        )
        
        print(f"Sample data created:")
        print(f"  User: {user.email}")
        print(f"  Project: {project.name}")
        print(f"  Dataset: {dataset.filename}")
        
    finally:
        db.close()


# Database cleanup utilities
def cleanup_expired_data():
    """Clean up expired datasets and related data"""
    db = get_db_sync()
    try:
        expired_datasets = DatasetService.get_expired_datasets(db)
        count = 0
        for dataset in expired_datasets:
            DatasetService.delete_dataset(db, dataset.id)
            count += 1
        print(f"Cleaned up {count} expired datasets")
    finally:
        db.close() 