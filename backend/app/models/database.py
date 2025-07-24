from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, ForeignKey, JSON, BigInteger
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    institution = Column(String)
    subscription_tier = Column(String, default="free")
    subscription_status = Column(String, default="active")
    trial_ends_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    # Relationships
    projects = relationship("Project", back_populates="owner")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"))
    name = Column(String, nullable=False)
    description = Column(Text)
    study_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_shared = Column(Boolean, default=False)
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    datasets = relationship("Dataset", back_populates="project")
    collaborators = relationship("ProjectCollaborator", back_populates="project")

class Dataset(Base):
    __tablename__ = "datasets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    filename = Column(String, nullable=False)
    storage_path = Column(String)
    file_size = Column(BigInteger)
    row_count = Column(Integer)
    column_count = Column(Integer)
    column_metadata = Column(JSON)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Relationships
    project = relationship("Project", back_populates="datasets")
    analyses = relationship("Analysis", back_populates="dataset")

class Analysis(Base):
    __tablename__ = "analyses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"))
    analysis_type = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False)
    results = Column(JSON)
    assumptions_checked = Column(JSON)
    warnings = Column(JSON)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    execution_time_ms = Column(Integer)
    
    # Relationships
    dataset = relationship("Dataset", back_populates="analyses")
    figures = relationship("Figure", back_populates="analysis")

class Figure(Base):
    __tablename__ = "figures"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"))
    figure_type = Column(String)
    style_preset = Column(String)
    custom_styling = Column(JSON)
    storage_path = Column(String)
    format = Column(String)
    dpi = Column(Integer)
    width = Column(Float)
    height = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    analysis = relationship("Analysis", back_populates="figures")

class ProjectCollaborator(Base):
    __tablename__ = "project_collaborators"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"))
    role = Column(String, default="viewer")  # owner, editor, viewer
    invited_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="collaborators")
    user = relationship("User") 