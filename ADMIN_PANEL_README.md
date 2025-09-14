# SciFig Admin Panel

This document describes the admin panel functionality for the SciFig AI Statistical Engine.

## Overview

The admin panel provides comprehensive management capabilities for administrators to:
- View system statistics and health
- Manage users and their roles
- Control usage limits per user
- View analytics and system data
- Monitor anonymous usage

## Features

### 🏠 Overview Dashboard
- **System Statistics**: Total users, active users, analyses performed
- **System Health**: Real-time system status indicators
- **Quick Metrics**: Daily and weekly activity summaries

### 👥 User Management
- **View All Users**: Complete list of registered users
- **Create Users**: Add new users with specific roles
- **Update Roles**: Change user roles (admin, researcher, analyst, user)
- **Delete Users**: Remove users from the system
- **Role-based Access**: Different permissions based on user roles

### 📊 Usage Management
- **View Usage**: See analysis usage for all users
- **Reset Usage**: Reset individual or all usage limits per user
- **Usage Limits**: 
  - Anonymous users: 1 statistical analysis, 1 figure analysis
  - Authenticated users: 3 statistical analyses, 3 figure analyses
  - Admin/Researcher: Unlimited usage
- **Visual Progress**: Progress bars showing usage vs limits

### 📈 Analytics
- **System Analytics**: Daily/weekly activity trends
- **User Activity**: Tracking user engagement
- **Feature Usage**: Analysis of most-used features

### ⚙️ System Management
- **System Information**: Health metrics and storage usage
- **Quick Actions**: Refresh data, navigate back to dashboard

## User Roles

The system supports four user roles with different privileges:

| Role | Description | Usage Limits | Admin Panel Access |
|------|-------------|--------------|-------------------|
| **Admin** | Full system access | Unlimited | Full access |
| **Researcher** | Research-focused users | Unlimited | No access |
| **Analyst** | Data analysis users | Standard limits | No access |
| **User** | Regular users | Standard limits | No access |

## Access Control

### Admin Panel Access
- Only users with `admin` role can access the admin panel
- URL access: `?admin=true` parameter (requires admin authentication)
- Protected routes with role-based authentication

### API Endpoints
All admin endpoints are protected and require admin authentication:

```
GET  /api/v1/admin/stats              - System statistics
GET  /api/v1/admin/users/usage        - User usage data
PUT  /api/v1/admin/users/{id}/usage   - Update user usage limits
POST /api/v1/admin/users/{id}/reset-usage - Reset user usage
GET  /api/v1/admin/anonymous-usage    - Anonymous usage statistics
POST /api/v1/admin/users              - Create new user
DELETE /api/v1/admin/users/{id}       - Delete user
GET  /api/v1/admin/analytics          - System analytics
```

## Setting Up Admin Access

### 1. Create Your First Admin User

Run the admin user creation script:

```bash
cd backend
python create_admin_user.py
```

**Interactive Mode:**
The script will guide you through creating an admin user:
```bash
python create_admin_user.py
```

**Command Line Mode:**
```bash
python create_admin_user.py --email admin@yourcompany.com --password your_secure_password --name "System Administrator"
```

**Promote Existing User:**
```bash
python create_admin_user.py --promote existing_user@company.com
```

### 2. Environment Requirements

Ensure these environment variables are set:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Access the Admin Panel

1. Start the backend server:
   ```bash
   cd backend
   python -m app.main
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to the admin panel:
   - Sign in with your admin account
   - Access via URL: `http://localhost:5173/?admin=true`
   - Or modify the frontend routing to include admin navigation

## Usage Examples

### Managing User Usage

**Reset a user's statistical analysis usage:**
```http
POST /api/v1/admin/users/{user_id}/reset-usage?feature_type=statistical_analysis
Authorization: Bearer {admin_token}
```

**Reset all usage for a user:**
```http
POST /api/v1/admin/users/{user_id}/reset-usage
Authorization: Bearer {admin_token}
```

### Creating Users Programmatically

```http
POST /api/v1/admin/users
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "email": "newuser@company.com",
  "password": "secure_password",
  "full_name": "New User",
  "organization": "Research Lab",
  "role": "researcher"
}
```

### Updating User Roles

```http
PUT /api/v1/auth/users/{user_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "role": "admin"
}
```

## Security Considerations

1. **Admin Account Security**: Use strong passwords for admin accounts
2. **Environment Variables**: Keep service role keys secure
3. **Role Verification**: All admin endpoints verify admin role before execution
4. **Audit Trail**: Consider implementing audit logging for admin actions

## Database Schema

The admin panel works with these key tables:

### users
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE NOT NULL
full_name TEXT
role TEXT DEFAULT 'user'
organization TEXT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### user_usage
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
feature_type TEXT CHECK (feature_type IN ('statistical_analysis', 'figure_analysis'))
usage_count INTEGER DEFAULT 1
first_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

### anonymous_usage
```sql
id UUID PRIMARY KEY
ip_address TEXT NOT NULL
feature_type TEXT CHECK (feature_type IN ('statistical_analysis', 'figure_analysis'))
usage_count INTEGER DEFAULT 1
first_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## Troubleshooting

### Common Issues

1. **"Access Denied" Error**
   - Verify the user has admin role
   - Check authentication token validity

2. **"Failed to load dashboard data"**
   - Ensure backend server is running
   - Check database connectivity
   - Verify environment variables

3. **Script fails to create admin user**
   - Check Supabase service role key permissions
   - Verify database table exists
   - Ensure user doesn't already exist

### Debug Mode

Enable debug logging in the frontend:
```javascript
localStorage.setItem('debug', 'true');
```

## Future Enhancements

Potential improvements for the admin panel:

1. **Audit Logging**: Track all admin actions
2. **Bulk Operations**: Mass user management operations
3. **Custom Usage Limits**: Per-user custom limits
4. **Email Notifications**: Alert users about usage limits
5. **Advanced Analytics**: Detailed usage reports and charts
6. **System Configuration**: Runtime configuration management
7. **Backup Management**: Database backup controls

## Support

For issues with the admin panel:
1. Check the console for error messages
2. Verify user permissions and authentication
3. Ensure all environment variables are properly set
4. Check backend server logs for detailed error information 