from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sqlite3
import json

staff_bp = Blueprint('enhanced_staff', __name__, url_prefix='/api/enhanced-staff')

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('timetable.db')
    conn.row_factory = sqlite3.Row
    return conn

@staff_bp.route('/choice-forms/available', methods=['GET'])
@jwt_required()
def get_available_choice_forms():
    """Get available choice forms for staff"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user's department
        cursor.execute('SELECT department_id FROM users WHERE id = ?', (current_user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({'error': 'User not found'}), 404
        
        # Get available forms
        cursor.execute('''
            SELECT scf.*, 
                   CASE WHEN scs.id IS NOT NULL THEN 1 ELSE 0 END as has_submitted
            FROM subject_choice_forms scf
            LEFT JOIN subject_choice_submissions scs ON scf.id = scs.form_id AND scs.staff_id = ?
            WHERE scf.department_id = ? AND scf.status = 'open'
            ORDER BY scf.close_date ASC
        ''', (current_user_id, user_data['department_id']))
        
        forms = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'forms': [dict(row) for row in forms]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@staff_bp.route('/choice-forms/<int:form_id>/submit', methods=['POST'])
@jwt_required()
def submit_choice_form(form_id):
    """Submit choice form preferences"""
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if form is still open
        cursor.execute('SELECT status FROM subject_choice_forms WHERE id = ?', (form_id,))
        form_data = cursor.fetchone()
        
        if not form_data or form_data['status'] != 'open':
            return jsonify({'error': 'Form is not available for submission'}), 400
        
        # Insert or update submission
        cursor.execute('''
            INSERT OR REPLACE INTO subject_choice_submissions 
            (form_id, staff_id, subject_preferences, additional_notes)
            VALUES (?, ?, ?, ?)
        ''', (
            form_id, current_user_id, 
            json.dumps(data.get('subject_preferences', [])),
            data.get('additional_notes', '')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Preferences submitted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@staff_bp.route('/my-submissions', methods=['GET'])
@jwt_required()
def get_my_submissions():
    """Get staff's choice form submissions"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT scs.*, scf.title as form_title, scf.status as form_status
            FROM subject_choice_submissions scs
            JOIN subject_choice_forms scf ON scs.form_id = scf.id
            WHERE scs.staff_id = ?
            ORDER BY scs.submitted_at DESC
        ''', (current_user_id,))
        
        submissions = cursor.fetchall()
        conn.close()
        
        return jsonify({
            'success': True,
            'submissions': [dict(row) for row in submissions]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@staff_bp.route('/my-timetable', methods=['GET'])
@jwt_required()
def get_my_timetable():
    """Get staff's personal timetable"""
    try:
        current_user_id = get_jwt_identity()
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get from generated timetables
        cursor.execute('''
            SELECT gt.timetable_data
            FROM generated_timetables gt
            JOIN users u ON gt.department_id = u.department_id
            WHERE u.id = ? AND gt.timetable_type = 'staff' AND gt.status = 'approved'
            ORDER BY gt.created_at DESC
            LIMIT 1
        ''', (current_user_id,))
        
        timetable_data = cursor.fetchone()
        
        if timetable_data:
            timetable_json = json.loads(timetable_data['timetable_data'])
            staff_timetable = timetable_json.get(str(current_user_id), {})
        else:
            staff_timetable = {}
        
        conn.close()
        
        return jsonify({
            'success': True,
            'timetable': staff_timetable
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500