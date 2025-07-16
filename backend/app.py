import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import string
from datetime import timedelta
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
import requests

load_dotenv()

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_urlsafe(32))
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

jwt = JWTManager(app)
CORS(app, origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"])

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database initialization
def init_db():
    conn = sqlite3.connect('timetable.db')
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            employee_id TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('main_admin', 'dept_admin', 'staff')),
            department_id INTEGER,
            college TEXT,
            programme TEXT,
            type TEXT,
            contact_number TEXT,
            staff_role TEXT CHECK (staff_role IN ('assistant_professor', 'associate_professor', 'professor', 'hod')),
            subjects_selected TEXT,
            subjects_locked BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')
    
    # Departments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            college TEXT NOT NULL,
            programme TEXT NOT NULL CHECK (programme IN ('UG', 'PG')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Subjects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            credits INTEGER DEFAULT 3,
            hours INTEGER DEFAULT 3,
            type TEXT DEFAULT 'Core' CHECK (type IN ('Core', 'Elective', 'Skill', 'CDC')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')
    
    # Classes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS classes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            section TEXT NOT NULL,
            year INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            strength INTEGER DEFAULT 60,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')
    
    # Classrooms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS classrooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            type TEXT DEFAULT 'Classroom' CHECK (type IN ('Classroom', 'Lab')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')
    
    # Choice forms table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS choice_forms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            department_id INTEGER NOT NULL,
            subjects_data TEXT, -- JSON array of subjects with options
            open_date TIMESTAMP NOT NULL,
            close_date TIMESTAMP NOT NULL,
            status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id),
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')
    
    # Choice submissions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS choice_submissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            form_id INTEGER NOT NULL,
            staff_id INTEGER NOT NULL,
            subject_preferences TEXT, -- JSON array of selected subjects
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (form_id) REFERENCES choice_forms (id),
            FOREIGN KEY (staff_id) REFERENCES users (id),
            UNIQUE(form_id, staff_id)
        )
    ''')
    
    # Timetables table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS timetables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_id INTEGER NOT NULL,
            class_id INTEGER NOT NULL,
            day TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            subject_id INTEGER NOT NULL,
            staff_id INTEGER NOT NULL,
            classroom_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id),
            FOREIGN KEY (class_id) REFERENCES classes (id),
            FOREIGN KEY (subject_id) REFERENCES subjects (id),
            FOREIGN KEY (staff_id) REFERENCES users (id),
            FOREIGN KEY (classroom_id) REFERENCES classrooms (id)
        )
    ''')
    
    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            sender_id INTEGER NOT NULL,
            recipient_type TEXT NOT NULL CHECK (recipient_type IN ('staff', 'dept_admin', 'main_admin', 'all')),
            department_id INTEGER,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')
    
    # Queries table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS queries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            sender_id INTEGER NOT NULL,
            recipient_id INTEGER,
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
            response TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            resolved_at TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (recipient_id) REFERENCES users (id)
        )
    ''')
    
    # Credentials export table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS credentials_export (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            plain_password TEXT NOT NULL,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            exported BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Insert default main admin if not exists
    cursor.execute('SELECT id FROM users WHERE email = ?', ('srmtt@srmist.edu.in',))
    if not cursor.fetchone():
        password_hash = generate_password_hash('mcs2024')
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, username, employee_id, role, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ('Main Administrator', 'srmtt@srmist.edu.in', password_hash, 'mainadmin', 'ADMIN001', 'main_admin', 'approved'))
    
    conn.commit()
    conn.close()

# Initialize database
init_db()

# Helper functions
def get_db_connection():
    conn = sqlite3.connect('timetable.db')
    conn.row_factory = sqlite3.Row
    return conn

def generate_username(email):
    return email.split('@')[0].lower()

def generate_password():
    return ''.join(secrets.choice(string.ascii_letters + string.digits + "!@#$%^&*") for _ in range(10))

def query_groq_ai(query):
    """Query GROQ AI for responses"""
    try:
        groq_api_key = os.getenv('GROQ_API_KEY')
        if not groq_api_key:
            return "AI service is not configured. Please contact administrator."
        
        headers = {
            'Authorization': f'Bearer {groq_api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are an AI assistant for SRM Timetable Management System. Help users with timetable, scheduling, department management, and academic queries. Be concise and helpful.'
                },
                {
                    'role': 'user',
                    'content': query
                }
            ],
            'model': 'llama3-8b-8192',
            'temperature': 0.7,
            'max_tokens': 500
        }
        
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', 
                               headers=headers, json=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            return "I'm having trouble processing your request right now. Please try again later."
    except Exception as e:
        logger.error(f"GROQ AI error: {e}")
        return "I'm currently unavailable. Please try again later or contact support."

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.password_hash, u.role, u.department_id, 
                   u.staff_role, u.subjects_selected, u.subjects_locked, u.username,
                   u.employee_id, u.approval_status, d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.email = ? AND u.is_active = 1
        ''', (email,))
        
        user_data = cursor.fetchone()
        conn.close()
        
        if not user_data or not check_password_hash(user_data['password_hash'], password):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user_data['approval_status'] != 'approved':
            return jsonify({'error': 'Your account is pending approval'}), 401
        
        user = {
            'id': str(user_data['id']),
            'name': user_data['name'],
            'email': user_data['email'],
            'role': user_data['role'],
            'department_id': str(user_data['department_id']) if user_data['department_id'] else None,
            'staff_role': user_data['staff_role'],
            'subjects_selected': user_data['subjects_selected'].split(',') if user_data['subjects_selected'] else [],
            'subjects_locked': bool(user_data['subjects_locked']),
            'username': user_data['username'],
            'employee_id': user_data['employee_id'],
            'department_name': user_data['department_name']
        }
        
        access_token = create_access_token(identity=str(user_data['id']))
        
        logger.info(f"User {email} logged in successfully with role {user['role']}")
        
        return jsonify({
            'success': True,
            'data': {
                'user': user,
                'token': access_token
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/verify', methods=['GET'])
@jwt_required()
def verify_token():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.role, u.department_id, 
                   u.staff_role, u.subjects_selected, u.subjects_locked, u.username,
                   u.employee_id, d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.id = ? AND u.is_active = 1 AND u.approval_status = 'approved'
        ''', (current_user_id,))
        
        user_data = cursor.fetchone()
        conn.close()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        user = {
            'id': str(user_data['id']),
            'name': user_data['name'],
            'email': user_data['email'],
            'role': user_data['role'],
            'department_id': str(user_data['department_id']) if user_data['department_id'] else None,
            'staff_role': user_data['staff_role'],
            'subjects_selected': user_data['subjects_selected'].split(',') if user_data['subjects_selected'] else [],
            'subjects_locked': bool(user_data['subjects_locked']),
            'username': user_data['username'],
            'employee_id': user_data['employee_id'],
            'department_name': user_data['department_name']
        }
        
        return jsonify({'success': True, 'data': {'user': user}}), 200
        
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        return jsonify({'error': 'Token verification failed'}), 401

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

# Department Management
@app.route('/api/departments', methods=['GET'])
@jwt_required()
def get_departments():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, name, code, college, programme FROM departments ORDER BY name')
        departments = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': str(dept['id']),
                'name': dept['name'],
                'code': dept['code'],
                'college': dept['college'],
                'programme': dept['programme']
            } for dept in departments]
        }), 200
        
    except Exception as e:
        logger.error(f"Get departments error: {str(e)}")
        return jsonify({'error': 'Failed to fetch departments'}), 500

@app.route('/api/departments', methods=['POST'])
@jwt_required()
def create_department():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Verify main admin
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        required_fields = ['name', 'code', 'college', 'programme']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Create department admin credentials
        dept_admin_email = f"{data['code'].lower()}.admin@srmist.edu.in"
        username = generate_username(dept_admin_email)
        password = generate_password()
        password_hash = generate_password_hash(password)
        
        # Insert department
        cursor.execute('''
            INSERT INTO departments (name, code, college, programme) 
            VALUES (?, ?, ?, ?)
        ''', (data['name'], data['code'], data['college'], data['programme']))
        dept_id = cursor.lastrowid
        
        # Create department admin user
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, username, employee_id, role, 
                             department_id, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (f"{data['name']} Admin", dept_admin_email, password_hash, username, 
              f"ADMIN{dept_id:03d}", 'dept_admin', dept_id, 'approved'))
        
        admin_user_id = cursor.lastrowid
        
        # Store credentials for export
        cursor.execute('''
            INSERT INTO credentials_export (user_id, username, plain_password)
            VALUES (?, ?, ?)
        ''', (admin_user_id, username, password))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(dept_id),
                'name': data['name'],
                'code': data['code'],
                'college': data['college'],
                'programme': data['programme'],
                'admin_credentials': {
                    'email': dept_admin_email,
                    'username': username,
                    'password': password
                }
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Create department error: {str(e)}")
        return jsonify({'error': 'Failed to create department'}), 500

# Staff Management
@app.route('/api/staff/register', methods=['POST'])
@jwt_required()
def register_staff():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify department admin
        cursor.execute('SELECT role, department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or user_data['role'] != 'dept_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        required_fields = ['name', 'employee_id', 'email', 'staff_role', 'contact_number']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'All fields are required'}), 400
        
        # Generate credentials
        username = generate_username(data['email'])
        password = generate_password()
        password_hash = generate_password_hash(password)
        
        # Create staff user (pending approval)
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, username, employee_id, role,
                             department_id, staff_role, contact_number, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['email'], password_hash, username, data['employee_id'],
              'staff', user_data['department_id'], data['staff_role'], 
              data['contact_number'], 'pending'))
        
        staff_user_id = cursor.lastrowid
        
        # Store credentials for later export
        cursor.execute('''
            INSERT INTO credentials_export (user_id, username, plain_password)
            VALUES (?, ?, ?)
        ''', (staff_user_id, username, password))
        
        # Send notification to main admin
        cursor.execute('''
            INSERT INTO notifications (title, message, sender_id, recipient_type)
            VALUES (?, ?, ?, ?)
        ''', ('New Staff Registration Request', 
              f'New staff registration request from {data["name"]} ({data["email"]})',
              current_user_id, 'main_admin'))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Staff registration request submitted for approval',
            'data': {
                'id': str(staff_user_id),
                'name': data['name'],
                'email': data['email'],
                'status': 'pending'
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Staff registration error: {str(e)}")
        return jsonify({'error': 'Failed to register staff'}), 500

@app.route('/api/staff/pending', methods=['GET'])
@jwt_required()
def get_pending_staff():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify main admin
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.employee_id, u.staff_role, u.contact_number,
                   u.created_at, d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'staff' AND u.approval_status = 'pending'
            ORDER BY u.created_at DESC
        ''')
        
        pending_staff = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': str(staff['id']),
                'name': staff['name'],
                'email': staff['email'],
                'employee_id': staff['employee_id'],
                'staff_role': staff['staff_role'],
                'contact_number': staff['contact_number'],
                'department_name': staff['department_name'],
                'created_at': staff['created_at']
            } for staff in pending_staff]
        }), 200
        
    except Exception as e:
        logger.error(f"Get pending staff error: {str(e)}")
        return jsonify({'error': 'Failed to fetch pending staff'}), 500

@app.route('/api/staff/approve/<int:staff_id>', methods=['POST'])
@jwt_required()
def approve_staff(staff_id):
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify main admin
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Approve staff
        cursor.execute('''
            UPDATE users SET approval_status = 'approved' WHERE id = ? AND role = 'staff'
        ''', (staff_id,))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Staff not found'}), 404
        
        # Get staff details for notification
        cursor.execute('SELECT name, email, department_id FROM users WHERE id = ?', (staff_id,))
        staff_data = cursor.fetchone()
        
        # Send notification to department admin
        cursor.execute('''
            INSERT INTO notifications (title, message, sender_id, recipient_type, department_id)
            VALUES (?, ?, ?, ?, ?)
        ''', ('Staff Approved', 
              f'Staff member {staff_data["name"]} has been approved and can now login',
              current_user_id, 'dept_admin', staff_data['department_id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Staff approved successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Approve staff error: {str(e)}")
        return jsonify({'error': 'Failed to approve staff'}), 500

# Credentials Management
@app.route('/api/credentials/generate', methods=['POST'])
@jwt_required()
def generate_credentials():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify main admin
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Get users without exported credentials
        cursor.execute('''
            SELECT u.id, u.name, u.email, u.role 
            FROM users u 
            LEFT JOIN credentials_export ce ON u.id = ce.user_id 
            WHERE u.role IN ('staff', 'dept_admin') 
            AND u.approval_status = 'approved'
            AND (ce.user_id IS NULL OR ce.exported = FALSE)
        ''')
        
        users_without_credentials = cursor.fetchall()
        
        generated_count = 0
        for user in users_without_credentials:
            # Check if credentials already exist
            cursor.execute('SELECT id FROM credentials_export WHERE user_id = ?', (user['id'],))
            if not cursor.fetchone():
                username = generate_username(user['email'])
                password = generate_password()
                password_hash = generate_password_hash(password)
                
                # Update user password
                cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', 
                             (password_hash, user['id']))
                
                # Store credentials
                cursor.execute('''
                    INSERT INTO credentials_export (user_id, username, plain_password)
                    VALUES (?, ?, ?)
                ''', (user['id'], username, password))
                
                generated_count += 1
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Generated credentials for {generated_count} users',
            'count': generated_count
        }), 200
        
    except Exception as e:
        logger.error(f"Generate credentials error: {str(e)}")
        return jsonify({'error': 'Failed to generate credentials'}), 500

@app.route('/api/credentials/export', methods=['GET'])
@jwt_required()
def export_credentials():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify main admin
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        # Get credentials data
        cursor.execute('''
            SELECT ce.username, ce.plain_password, u.name, u.email, u.role, 
                   d.name as department_name, ce.generated_at
            FROM credentials_export ce
            JOIN users u ON ce.user_id = u.id
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE ce.exported = FALSE
            ORDER BY ce.generated_at DESC
        ''')
        
        credentials_data = cursor.fetchall()
        
        if not credentials_data:
            return jsonify({'error': 'No new credentials to export'}), 404
        
        # Mark as exported
        cursor.execute('UPDATE credentials_export SET exported = TRUE WHERE exported = FALSE')
        conn.commit()
        conn.close()
        
        # Return credentials data for frontend to handle Excel export
        return jsonify({
            'success': True,
            'data': [{
                'name': cred['name'],
                'email': cred['email'],
                'role': cred['role'],
                'department_name': cred['department_name'],
                'username': cred['username'],
                'password': cred['plain_password'],
                'generated_at': cred['generated_at']
            } for cred in credentials_data]
        }), 200
        
    except Exception as e:
        logger.error(f"Export credentials error: {str(e)}")
        return jsonify({'error': 'Failed to export credentials'}), 500

# Continue with more routes...
if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')