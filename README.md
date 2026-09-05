# Sip Station POS & IBMS

A comprehensive web-based Point of Sale (POS) and Integrated Business Management System (IBMS) for café/coffee shop management.

## Features

### Core Modules
- **Authentication & User Management** - Role-based access control (Owner, Manager, Staff, Employee)
- **Point of Sale (POS)** - Product catalog, shopping cart, checkout, receipt generation
- **Dashboard** - Real-time statistics, quick actions, alerts
- **Product Management** - CRUD operations, categories, inventory integration
- **Inventory Management** - Stock tracking, low stock alerts, restocking
- **Sales & Reports** - Sales tracking, analytics, payment method breakdown
- **Attendance Management** - Time in/out tracking, QR code system, approval workflow
- **Schedule Management** - Weekly scheduling, shift assignments
- **Payroll Management** - Automated payroll calculation, payslip generation
- **Expense Tracking** - Business expense management, categorization
- **Document Management** - File upload, organization, download
- **Internal Messaging** - Team communication system

## Technology Stack

- **Frontend**: HTML5, Tailwind CSS, JavaScript, Chart.js
- **Backend**: PHP 7.4+ / PHP 8.x
- **Database**: MySQL 5.7+ / MariaDB
- **Security**: Bcrypt password hashing, prepared statements, CSRF protection

## Installation

### Prerequisites
- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache or Nginx web server
- Composer (optional, for dependency management)

### Step 1: Clone/Download the Project
```bash
cd c:\wamp64\www\
# Extract the project to newwwwwwwwwwwwwwwww folder
```

### Step 2: Database Setup
1. Create a new MySQL database named `sip_station_db`
2. Import the `database.sql` file:
```bash
mysql -u root -p sip_station_db < database.sql
```

Or use phpMyAdmin:
- Open phpMyAdmin
- Create database `sip_station_db`
- Import the `database.sql` file

### Step 3: Configuration
Edit `includes/config.php` to match your environment:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'sip_station_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // Your MySQL password
define('SITE_URL', 'http://localhost/newwwwwwwwwwwwwwwww');
```

### Step 4: File Permissions
Ensure the following directories are writable:
```bash
uploads/products/
uploads/receipts/
uploads/documents/
uploads/selfies/
uploads/expenses/
```

### Step 5: Access the Application
Open your browser and navigate to:
```
http://localhost/newwwwwwwwwwwwwwwww/
```

## Default Credentials

**Username:** admin  
**Password:** admin123

⚠️ **Important:** Change the default password after first login!

## User Roles & Permissions

### Owner
- Full access to all features
- User management (including deletion)
- System configuration

### Manager
- Full access except user deletion
- Can manage users (create, edit, activate/deactivate)
- All operational features

### Staff
- POS, inventory, reports
- Product management
- Sales tracking

### Employee
- Attendance tracking
- Schedule viewing
- Payroll viewing
- Personal profile management

## Color Scheme

- **Primary Green**: #22c55e, #16a34a, #15803d
- **Secondary Black**: #000000, #1A1A1A
- **Neutral White**: #FFFFFF, #F5F5F4, #E5E5E3
- **Accent Gray**: #6B6B68

## Project Structure

```
/newwwwwwwwwwwwwwwww/
├── index.php              # Login page
├── dashboard.php          # Main dashboard
├── logout.php             # Logout handler
├── database.sql           # Database schema
├── README.md              # This file
├── assets/
│   ├── css/               # Custom CSS files
│   ├── js/                # JavaScript files
│   └── images/            # Static images
├── includes/
│   ├── config.php         # Configuration
│   ├── db.php             # Database connection
│   ├── functions.php      # Helper functions
│   └── auth.php           # Authentication class
├── api/                   # REST API endpoints
│   ├── auth.php           # Authentication API
│   ├── products.php       # Products API
│   ├── sales.php          # Sales API
│   ├── inventory.php     # Inventory API
│   ├── attendance.php    # Attendance API
│   ├── schedule.php       # Schedule API
│   ├── payroll.php        # Payroll API
│   ├── expenses.php       # Expenses API
│   ├── documents.php      # Documents API
│   └── messages.php       # Messages API
├── modules/               # Feature modules
│   ├── pos/               # Point of Sale
│   ├── products/          # Product Management
│   ├── inventory/         # Inventory Management
│   ├── sales/             # Sales & Reports
│   ├── attendance/        # Attendance Management
│   ├── schedule/          # Schedule Management
│   ├── payroll/           # Payroll Management
│   ├── expenses/          # Expense Tracking
│   ├── documents/         # Document Management
│   ├── messages/          # Internal Messaging
│   └── users/             # User Management
└── uploads/               # File uploads
    ├── products/
    ├── receipts/
    ├── documents/
    ├── selfies/
    └── expenses/
```

## Security Features

- **Password Hashing**: Bcrypt with configurable cost
- **SQL Injection Prevention**: Prepared statements for all queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: Token-based validation
- **Session Security**: Secure session configuration
- **File Upload Validation**: Type and size checks
- **Role-Based Access Control**: Permission checks on all actions

## API Endpoints

### Authentication
- `POST /api/auth.php?action=login` - User login
- `POST /api/auth.php?action=logout` - User logout
- `POST /api/auth.php?action=register` - Register new user
- `GET /api/auth.php?action=get_users` - Get all users
- `GET /api/auth.php?action=get_user&id={id}` - Get user details
- `POST /api/auth.php?action=update_profile` - Update user profile
- `POST /api/auth.php?action=delete_user` - Delete user
- `POST /api/auth.php?action=toggle_user_status` - Toggle user status

### Products
- `GET /api/products.php?action=get_products` - Get products list
- `GET /api/products.php?action=get_product&id={id}` - Get single product
- `POST /api/products.php?action=create_product` - Create product
- `POST /api/products.php?action=update_product&id={id}` - Update product
- `POST /api/products.php?action=delete_product&id={id}` - Delete product
- `GET /api/products.php?action=get_categories` - Get categories

### Sales
- `POST /api/sales.php?action=create_sale` - Create sale
- `GET /api/sales.php?action=get_sales` - Get sales list
- `GET /api/sales.php?action=get_sale&id={id}` - Get sale details
- `POST /api/sales.php?action=update_sale_status` - Update sale status
- `GET /api/sales.php?action=get_sales_summary` - Get sales summary

### Inventory
- `GET /api/inventory.php?action=get_inventory` - Get inventory list
- `GET /api/inventory.php?action=get_product_inventory&product_id={id}` - Get product inventory
- `POST /api/inventory.php?action=restock` - Restock product
- `POST /api/inventory.php?action=update_stock` - Update stock levels
- `GET /api/inventory.php?action=get_low_stock` - Get low stock items

### Attendance
- `POST /api/attendance.php?action=time_in` - Clock in
- `POST /api/attendance.php?action=time_out` - Clock out
- `GET /api/attendance.php?action=get_attendance` - Get attendance records
- `POST /api/attendance.php?action=update_status` - Update attendance status
- `GET /api/attendance.php?action=get_attendance_summary` - Get attendance summary

### Schedule
- `POST /api/schedule.php?action=create_schedule` - Create schedule
- `POST /api/schedule.php?action=update_schedule&id={id}` - Update schedule
- `GET /api/schedule.php?action=get_schedule&id={id}` - Get schedule
- `GET /api/schedule.php?action=get_schedules` - Get schedules list
- `POST /api/schedule.php?action=delete_schedule&id={id}` - Delete schedule

### Payroll
- `POST /api/payroll.php?action=generate_payroll` - Generate payroll
- `GET /api/payroll.php?action=get_payroll&id={id}` - Get payroll details
- `GET /api/payroll.php?action=get_payroll_history` - Get payroll history
- `POST /api/payroll.php?action=update_status` - Update payroll status

### Expenses
- `POST /api/expenses.php?action=create_expense` - Create expense
- `POST /api/expenses.php?action=update_expense&id={id}` - Update expense
- `GET /api/expenses.php?action=get_expense&id={id}` - Get expense details
- `GET /api/expenses.php?action=get_expenses` - Get expenses list
- `POST /api/expenses.php?action=delete_expense&id={id}` - Delete expense
- `GET /api/expenses.php?action=get_expense_summary` - Get expense summary

### Documents
- `POST /api/documents.php?action=upload_document` - Upload document
- `GET /api/documents.php?action=get_documents` - Get documents list
- `GET /api/documents.php?action=download_document&id={id}` - Download document
- `POST /api/documents.php?action=delete_document&id={id}` - Delete document

### Messages
- `POST /api/messages.php?action=send_message` - Send message
- `GET /api/messages.php?action=get_message&id={id}` - Get message
- `GET /api/messages.php?action=get_messages` - Get messages list
- `POST /api/messages.php?action=mark_as_read` - Mark as read
- `POST /api/messages.php?action=delete_message&id={id}` - Delete message
- `GET /api/messages.php?action=get_unread_count` - Get unread count

## Deployment Guide

### Production Deployment

1. **Environment Configuration**
   - Update `includes/config.php` with production database credentials
   - Set `error_reporting(0)` in production
   - Update `SITE_URL` to your production domain

2. **Database**
   - Create production database
   - Import `database.sql`
   - Create a dedicated database user with limited privileges

3. **Security**
   - Change default admin password immediately
   - Enable HTTPS/SSL
   - Set proper file permissions (755 for directories, 644 for files)
   - Disable directory browsing
   - Add `.htaccess` for additional security

4. **Performance**
   - Enable PHP OPcache
   - Configure MySQL for production use
   - Use CDN for static assets (Tailwind CSS, Chart.js, Font Awesome)
   - Enable Gzip compression

5. **Backup**
   - Set up automated database backups
   - Backup the `uploads` directory regularly
   - Document backup and restore procedures

### Troubleshooting

**Database Connection Error**
- Check MySQL credentials in `includes/config.php`
- Ensure MySQL service is running
- Verify database exists

**File Upload Issues**
- Check directory permissions for `uploads/` folder
- Verify PHP upload limits in `php.ini`:
  - `upload_max_filesize`
  - `post_max_size`
  - `memory_limit`

**Session Issues**
- Check session save path permissions
- Verify session configuration in `includes/config.php`
- Clear browser cookies

**Blank Pages**
- Enable error reporting in `includes/config.php`
- Check PHP error logs
- Verify all required files exist

## Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Check browser console for JavaScript errors
4. Check PHP error logs

## License

This project is proprietary software for Sip Station. All rights reserved.

## Credits

Developed for Sip Station POS & IBMS
Technology: PHP, MySQL, Tailwind CSS, JavaScript, Chart.js
