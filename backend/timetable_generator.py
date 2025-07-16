# AI Timetable Generator with conflict resolution
import sqlite3
import json
import random
from typing import Dict, List, Tuple, Set
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AITimetableGenerator:
    def __init__(self):
        self.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        self.time_slots = [
            '9:00-10:00', '10:00-11:00', '11:15-12:15', 
            '12:15-1:15', '2:15-3:15', '3:15-4:15', '4:30-5:30'
        ]
        
    def get_db_connection(self):
        conn = sqlite3.connect('timetable.db')
        conn.row_factory = sqlite3.Row
        return conn
    
    def generate_timetable(self, department_id: int) -> Dict:
        """Generate optimized timetable for a department"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            # Get department data
            cursor.execute('SELECT name FROM departments WHERE id = ?', (department_id,))
            dept_data = cursor.fetchone()
            if not dept_data:
                return {'error': 'Department not found'}
            
            # Get classes
            cursor.execute('''
                SELECT id, name, section, year, strength
                FROM classes WHERE department_id = ?
            ''', (department_id,))
            classes_data = cursor.fetchall()
            
            # Get staff and their subjects
            cursor.execute('''
                SELECT u.id, u.name, u.staff_role, cs.subject_preferences
                FROM users u
                LEFT JOIN choice_submissions cs ON u.id = cs.staff_id
                WHERE u.department_id = ? AND u.role = 'staff' AND u.approval_status = 'approved'
            ''', (department_id,))
            staff_data = cursor.fetchall()
            
            # Get subjects
            cursor.execute('''
                SELECT id, name, code, credits, hours, type 
                FROM subjects WHERE department_id = ?
            ''', (department_id,))
            subjects_data = cursor.fetchall()
            
            # Get classrooms
            cursor.execute('''
                SELECT id, name, capacity, type 
                FROM classrooms WHERE department_id = ?
            ''', (department_id,))
            classrooms_data = cursor.fetchall()
            
            conn.close()
            
            if not classes_data or not staff_data or not subjects_data or not classrooms_data:
                return {'error': 'Insufficient data for timetable generation'}
            
            # Process data
            classes = {c['id']: dict(c) for c in classes_data}
            subjects = {s['id']: dict(s) for s in subjects_data}
            classrooms = {c['id']: dict(c) for c in classrooms_data}
            
            # Process staff preferences
            staff_subjects = {}
            for staff in staff_data:
                if staff['subject_preferences']:
                    try:
                        preferences = json.loads(staff['subject_preferences'])
                        staff_subjects[staff['id']] = {
                            'name': staff['name'],
                            'role': staff['staff_role'],
                            'subjects': preferences
                        }
                    except:
                        continue
            
            # Generate timetable using AI optimization
            timetable = self._optimize_timetable(classes, staff_subjects, subjects, classrooms)
            
            # Save timetable to database
            self._save_timetable(department_id, timetable)
            
            return {
                'success': True,
                'timetable': timetable,
                'department': dept_data['name'],
                'generated_at': datetime.now().isoformat(),
                'stats': {
                    'total_classes': len(timetable),
                    'classes_count': len(classes),
                    'staff_count': len(staff_subjects),
                    'subjects_count': len(subjects)
                }
            }
            
        except Exception as e:
            logger.error(f"Timetable generation error: {e}")
            return {'error': str(e)}
    
    def _optimize_timetable(self, classes: Dict, staff_subjects: Dict, 
                          subjects: Dict, classrooms: Dict) -> List:
        """AI-powered timetable optimization with conflict resolution"""
        timetable = []
        
        # Track usage to avoid conflicts
        staff_schedule = {}  # staff_id: {day: {time_slot: True}}
        classroom_schedule = {}  # classroom_id: {day: {time_slot: True}}
        
        # Initialize schedules
        for staff_id in staff_subjects.keys():
            staff_schedule[staff_id] = {day: {} for day in self.days}
        
        for classroom_id in classrooms.keys():
            classroom_schedule[classroom_id] = {day: {} for day in self.days}
        
        # Create assignments for each class-subject combination
        assignments = []
        for class_id, class_info in classes.items():
            for subject_id, subject_info in subjects.items():
                # Find available staff for this subject
                available_staff = []
                for staff_id, staff_info in staff_subjects.items():
                    if str(subject_id) in staff_info['subjects']:
                        available_staff.append(staff_id)
                
                if not available_staff:
                    continue
                
                # Calculate hours needed based on subject hours
                hours_needed = subject_info.get('hours', 3)
                
                for _ in range(hours_needed):
                    assignments.append({
                        'class_id': class_id,
                        'class_name': class_info['name'],
                        'subject_id': subject_id,
                        'subject_name': subject_info['name'],
                        'subject_code': subject_info['code'],
                        'available_staff': available_staff,
                        'class_strength': class_info['strength']
                    })
        
        # Shuffle assignments for better distribution
        random.shuffle(assignments)
        
        # Assign time slots using constraint satisfaction
        for assignment in assignments:
            assigned = False
            attempts = 0
            max_attempts = 100
            
            while not assigned and attempts < max_attempts:
                day = random.choice(self.days)
                time_slot = random.choice(self.time_slots)
                
                # Select staff with least workload
                best_staff = None
                min_workload = float('inf')
                
                for staff_id in assignment['available_staff']:
                    workload = sum(len(slots) for slots in staff_schedule[staff_id].values())
                    if (workload < min_workload and 
                        time_slot not in staff_schedule[staff_id][day]):
                        min_workload = workload
                        best_staff = staff_id
                
                if not best_staff:
                    attempts += 1
                    continue
                
                # Find suitable classroom
                suitable_classrooms = [
                    cid for cid, cinfo in classrooms.items()
                    if (cinfo['capacity'] >= assignment['class_strength'] and
                        time_slot not in classroom_schedule[cid][day])
                ]
                
                if not suitable_classrooms:
                    attempts += 1
                    continue
                
                # Select classroom (prefer regular classrooms for theory, labs for lab subjects)
                selected_classroom = None
                subject_type = subjects[assignment['subject_id']].get('type', 'Core')
                
                if 'Lab' in assignment['subject_name'] or subject_type == 'Lab':
                    # Prefer lab classrooms
                    lab_classrooms = [cid for cid in suitable_classrooms 
                                    if classrooms[cid]['type'] == 'Lab']
                    selected_classroom = random.choice(lab_classrooms) if lab_classrooms else random.choice(suitable_classrooms)
                else:
                    # Prefer regular classrooms
                    regular_classrooms = [cid for cid in suitable_classrooms 
                                        if classrooms[cid]['type'] == 'Classroom']
                    selected_classroom = random.choice(regular_classrooms) if regular_classrooms else random.choice(suitable_classrooms)
                
                # Add to timetable
                timetable.append({
                    'day': day,
                    'time_slot': time_slot,
                    'class_id': assignment['class_id'],
                    'class_name': assignment['class_name'],
                    'subject_id': assignment['subject_id'],
                    'subject_name': assignment['subject_name'],
                    'subject_code': assignment['subject_code'],
                    'staff_id': best_staff,
                    'staff_name': staff_subjects[best_staff]['name'],
                    'classroom_id': selected_classroom,
                    'classroom_name': classrooms[selected_classroom]['name']
                })
                
                # Update schedules
                staff_schedule[best_staff][day][time_slot] = True
                classroom_schedule[selected_classroom][day][time_slot] = True
                assigned = True
                
                attempts += 1
            
            if not assigned:
                logger.warning(f"Could not assign: {assignment['subject_name']} for {assignment['class_name']}")
        
        # Sort timetable by day and time
        day_order = {day: i for i, day in enumerate(self.days)}
        time_order = {slot: i for i, slot in enumerate(self.time_slots)}
        
        timetable.sort(key=lambda x: (day_order[x['day']], time_order[x['time_slot']]))
        
        return timetable
    
    def _save_timetable(self, department_id: int, timetable: List):
        """Save generated timetable to database"""
        conn = self.get_db_connection()
        cursor = conn.cursor()
        
        # Clear existing timetable for department
        cursor.execute('DELETE FROM timetables WHERE department_id = ?', (department_id,))
        
        # Insert new timetable
        for entry in timetable:
            cursor.execute('''
                INSERT INTO timetables (department_id, class_id, day, time_slot, 
                                      subject_id, staff_id, classroom_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                department_id,
                entry['class_id'],
                entry['day'],
                entry['time_slot'],
                entry['subject_id'],
                entry['staff_id'],
                entry['classroom_id']
            ))
        
        conn.commit()
        conn.close()
    
    def get_staff_timetable(self, staff_id: int) -> Dict:
        """Get timetable for a specific staff member"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT t.day, t.time_slot, s.name as subject_name, s.code as subject_code,
                       c.name as class_name, cr.name as classroom_name
                FROM timetables t
                JOIN subjects s ON t.subject_id = s.id
                JOIN classes c ON t.class_id = c.id
                JOIN classrooms cr ON t.classroom_id = cr.id
                WHERE t.staff_id = ?
                ORDER BY t.day, t.time_slot
            ''', (staff_id,))
            
            timetable_data = cursor.fetchall()
            conn.close()
            
            # Organize by day and time
            schedule = {}
            for entry in timetable_data:
                day = entry['day']
                if day not in schedule:
                    schedule[day] = {}
                
                schedule[day][entry['time_slot']] = {
                    'subject': f"{entry['subject_code']} - {entry['subject_name']}",
                    'class': entry['class_name'],
                    'classroom': entry['classroom_name']
                }
            
            return {
                'success': True,
                'schedule': schedule
            }
            
        except Exception as e:
            logger.error(f"Staff timetable error: {e}")
            return {'error': str(e)}
    
    def get_department_timetable(self, department_id: int) -> Dict:
        """Get complete timetable for a department"""
        try:
            conn = self.get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT t.day, t.time_slot, s.name as subject_name, s.code as subject_code,
                       c.name as class_name, u.name as staff_name, cr.name as classroom_name
                FROM timetables t
                JOIN subjects s ON t.subject_id = s.id
                JOIN classes c ON t.class_id = c.id
                JOIN users u ON t.staff_id = u.id
                JOIN classrooms cr ON t.classroom_id = cr.id
                WHERE t.department_id = ?
                ORDER BY t.day, t.time_slot
            ''', (department_id,))
            
            timetable_data = cursor.fetchall()
            conn.close()
            
            return {
                'success': True,
                'timetable': [dict(row) for row in timetable_data]
            }
            
        except Exception as e:
            logger.error(f"Department timetable error: {e}")
            return {'error': str(e)}