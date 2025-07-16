# Additional routes for the Flask application
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sqlite3
import json
from datetime import datetime
import requests
import os

# Create blueprint for additional routes
routes_bp = Blueprint('routes', __name__)

def get_db_connection():
    conn = sqlite3.connect('timetable.db')
    conn.row_factory = sqlite3.Row
    return conn

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
        return "I'm currently unavailable. Please try again later or contact support."

# Subject Management
@routes_bp.route('/api/subjects', methods=['GET'])
@jwt_required()
def get_subjects():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or not user_data['department_id']:
            return jsonify({'success': True, 'data': []}), 200
        
        cursor.execute('''
            SELECT id, name, code, credits, hours, type
            FROM subjects
            WHERE department_id = ?
            ORDER BY name
        ''', (user_data['department_id'],))
        
        subjects = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': str(subject['id']),
                'name': subject['name'],
                'code': subject['code'],
                'credits': subject['credits'],
                'hours': subject['hours'],
                'type': subject['type']
            } for subject in subjects]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/subjects', methods=['POST'])
@jwt_required()
def create_subject():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id, role FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or user_data['role'] not in ['dept_admin', 'main_admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        required_fields = ['name', 'code']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'Name and code are required'}), 400
        
        cursor.execute('''
            INSERT INTO subjects (name, code, department_id, credits, hours, type)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['code'], user_data['department_id'], 
              data.get('credits', 3), data.get('hours', 3), data.get('type', 'Core')))
        
        subject_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(subject_id),
                'name': data['name'],
                'code': data['code'],
                'credits': data.get('credits', 3),
                'hours': data.get('hours', 3),
                'type': data.get('type', 'Core')
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Class Management
@routes_bp.route('/api/classes', methods=['GET'])
@jwt_required()
def get_classes():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or not user_data['department_id']:
            return jsonify({'success': True, 'data': []}), 200
        
        cursor.execute('''
            SELECT id, name, section, year, strength
            FROM classes
            WHERE department_id = ?
            ORDER BY year, section
        ''', (user_data['department_id'],))
        
        classes = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': str(cls['id']),
                'name': cls['name'],
                'section': cls['section'],
                'year': cls['year'],
                'strength': cls['strength']
            } for cls in classes]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/classes', methods=['POST'])
@jwt_required()
def create_class():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id, role FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or user_data['role'] not in ['dept_admin', 'main_admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        required_fields = ['name', 'section', 'year']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'Name, section, and year are required'}), 400
        
        cursor.execute('''
            INSERT INTO classes (name, section, year, department_id, strength)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['name'], data['section'], data['year'], 
              user_data['department_id'], data.get('strength', 60)))
        
        class_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(class_id),
                'name': data['name'],
                'section': data['section'],
                'year': data['year'],
                'strength': data.get('strength', 60)
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Choice Forms Management
@routes_bp.route('/api/choice-forms', methods=['GET'])
@jwt_required()
def get_choice_forms():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id, role FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or not user_data['department_id']:
            return jsonify({'success': True, 'data': []}), 200
        
        if user_data['role'] == 'staff':
            # For staff, get available forms with submission status
            cursor.execute('''
                SELECT cf.id, cf.title, cf.description, cf.subjects_data, cf.open_date, 
                       cf.close_date, cf.status,
                       CASE WHEN cs.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
                FROM choice_forms cf
                LEFT JOIN choice_submissions cs ON cf.id = cs.form_id AND cs.staff_id = ?
                WHERE cf.department_id = ? AND cf.status = 'open'
                ORDER BY cf.close_date ASC
            ''', (current_user_id, user_data['department_id']))
        else:
            # For dept_admin, get all forms
            cursor.execute('''
                SELECT cf.id, cf.title, cf.description, cf.subjects_data, cf.open_date, 
                       cf.close_date, cf.status, cf.created_at,
                       COUNT(cs.id) as submission_count
                FROM choice_forms cf
                LEFT JOIN choice_submissions cs ON cf.id = cs.form_id
                WHERE cf.department_id = ?
                GROUP BY cf.id
                ORDER BY cf.created_at DESC
            ''', (user_data['department_id'],))
        
        forms = cursor.fetchall()
        conn.close()
        
        result = []
        for form in forms:
            form_data = {
                'id': str(form['id']),
                'title': form['title'],
                'description': form['description'],
                'subjects_data': json.loads(form['subjects_data']) if form['subjects_data'] else [],
                'open_date': form['open_date'],
                'close_date': form['close_date'],
                'status': form['status']
            }
            
            if user_data['role'] == 'staff':
                form_data['has_submitted'] = bool(form['has_submitted'])
            else:
                form_data['submission_count'] = form['submission_count']
                form_data['created_at'] = form['created_at']
            
            result.append(form_data)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/choice-forms', methods=['POST'])
@jwt_required()
def create_choice_form():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id, role FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data or user_data['role'] not in ['dept_admin', 'main_admin']:
            return jsonify({'error': 'Access denied'}), 403
        
        required_fields = ['title', 'open_date', 'close_date', 'subjects_data']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'All fields are required'}), 400
        
        cursor.execute('''
            INSERT INTO choice_forms (title, description, department_id, subjects_data, 
                                    open_date, close_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (data['title'], data.get('description', ''), user_data['department_id'],
              json.dumps(data['subjects_data']), data['open_date'], 
              data['close_date'], current_user_id))
        
        form_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': {
                'id': str(form_id),
                'title': data['title'],
                'description': data.get('description', ''),
                'status': 'draft'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/choice-forms/<int:form_id>/toggle', methods=['POST'])
@jwt_required()
def toggle_choice_form(form_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        status = data.get('status')
        
        if status not in ['open', 'closed']:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify user has access to this form
        cursor.execute('''
            SELECT cf.id FROM choice_forms cf
            JOIN users u ON cf.department_id = u.department_id
            WHERE cf.id = ? AND u.id = ? AND u.role IN ('dept_admin', 'main_admin')
        ''', (form_id, current_user_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Access denied'}), 403
        
        cursor.execute('UPDATE choice_forms SET status = ? WHERE id = ?', (status, form_id))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Form status updated to {status}'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/choice-forms/<int:form_id>/submit', methods=['POST'])
@jwt_required()
def submit_choice_form(form_id):
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify form is open and user is staff
        cursor.execute('''
            SELECT cf.id FROM choice_forms cf
            JOIN users u ON cf.department_id = u.department_id
            WHERE cf.id = ? AND u.id = ? AND u.role = 'staff' AND cf.status = 'open'
        ''', (form_id, current_user_id))
        
        if not cursor.fetchone():
            return jsonify({'error': 'Form not available for submission'}), 400
        
        # Insert or update submission
        cursor.execute('''
            INSERT OR REPLACE INTO choice_submissions (form_id, staff_id, subject_preferences)
            VALUES (?, ?, ?)
        ''', (form_id, current_user_id, json.dumps(data.get('subject_preferences', []))))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Preferences submitted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Notifications Management
@routes_bp.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's role and department
        cursor.execute('SELECT role, department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Build query based on user role
        if user_data['role'] == 'main_admin':
            cursor.execute('''
                SELECT n.id, n.title, n.message, n.created_at, n.is_read,
                       u.name as sender_name
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                WHERE n.recipient_type IN ('main_admin', 'all')
                ORDER BY n.created_at DESC
                LIMIT 50
            ''')
        elif user_data['role'] == 'dept_admin':
            cursor.execute('''
                SELECT n.id, n.title, n.message, n.created_at, n.is_read,
                       u.name as sender_name
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                WHERE (n.recipient_type IN ('dept_admin', 'all') AND 
                       (n.department_id = ? OR n.department_id IS NULL))
                ORDER BY n.created_at DESC
                LIMIT 50
            ''', (user_data['department_id'],))
        else:  # staff
            cursor.execute('''
                SELECT n.id, n.title, n.message, n.created_at, n.is_read,
                       u.name as sender_name
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                WHERE (n.recipient_type IN ('staff', 'all') AND 
                       (n.department_id = ? OR n.department_id IS NULL))
                ORDER BY n.created_at DESC
                LIMIT 50
            ''', (user_data['department_id'],))
        
        notifications = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'data': [{
                'id': str(notif['id']),
                'title': notif['title'],
                'message': notif['message'],
                'sender_name': notif['sender_name'],
                'created_at': notif['created_at'],
                'is_read': bool(notif['is_read'])
            } for notif in notifications]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@routes_bp.route('/api/notifications', methods=['POST'])
@jwt_required()
def send_notification():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get current user's department
        cursor.execute('SELECT department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        required_fields = ['title', 'message', 'recipient_type']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'Title, message, and recipient type are required'}), 400
        
        cursor.execute('''
            INSERT INTO notifications (title, message, sender_id, recipient_type, department_id)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['title'], data['message'], current_user_id, 
              data['recipient_type'], user_data['department_id'] if user_data else None))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Notification sent successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# AI Assistant
@routes_bp.route('/api/ai-assistant', methods=['POST'])
@jwt_required()
def ai_assistant():
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400
        
        response = query_groq_ai(query)
        
        return jsonify({
            'success': True,
            'response': response
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Analytics for Main Admin
@routes_bp.route('/api/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Verify main admin
        cursor.execute('SELECT role FROM users WHERE id = ?', (current_user_id,))
        user_role = cursor.fetchone()
        
        if not user_role or user_role['role'] != 'main_admin':
            return jsonify({'error': 'Access denied'}), 403
        
        analytics = {}
        
        # Total departments
        cursor.execute('SELECT COUNT(*) as count FROM departments')
        analytics['total_departments'] = cursor.fetchone()['count']
        
        # Total staff
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = "staff"')
        analytics['total_staff'] = cursor.fetchone()['count']
        
        # Pending approvals
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE approval_status = "pending"')
        analytics['pending_approvals'] = cursor.fetchone()['count']
        
        # Total timetables
        cursor.execute('SELECT COUNT(DISTINCT department_id) as count FROM timetables')
        analytics['timetable_generations'] = cursor.fetchone()['count']
        
        # Department admins
        cursor.execute('SELECT COUNT(*) as count FROM users WHERE role = "dept_admin"')
        analytics['total_dept_admins'] = cursor.fetchone()['count']
        
        # Pending credentials
        cursor.execute('SELECT COUNT(*) as count FROM credentials_export WHERE exported = FALSE')
        analytics['pending_credentials'] = cursor.fetchone()['count']
        
        # Total notifications
        cursor.execute('SELECT COUNT(*) as count FROM notifications')
        analytics['total_notifications'] = cursor.fetchone()['count']
        
        conn.close()
        
        return jsonify({
            'success': True,
            'analytics': analytics
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500