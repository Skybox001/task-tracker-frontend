import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API = 'http://localhost:5000/api/tasks'

// ── Helper: check if a date is today or overdue ──
// Returns: 'overdue', 'today', or null
function getDeadlineStatus(deadline) {
  if (!deadline) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Strip time — just compare dates

  const due = new Date(deadline)
  due.setHours(0, 0, 0, 0)

  if (due < today) return 'overdue'
  if (due.getTime() === today.getTime()) return 'today'
  return null
}

function App() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')       // NEW: search state
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    deadline: ''
  })

  // Load tasks when filter changes
  useEffect(() => {
    fetchTasks()
  }, [filter])

  // Fetch tasks from backend API
  const fetchTasks = async () => {
    try {
      const url = filter === 'all' ? API : `${API}?status=${filter}`
      const res = await axios.get(url)
      setTasks(res.data)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  // Handle form input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Submit form — create or update
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editTask) {
        await axios.put(`${API}/${editTask._id}`, form)
      } else {
        await axios.post(API, form)
      }
      setForm({ title: '', description: '', priority: 'medium', deadline: '' })
      setShowForm(false)
      setEditTask(null)
      fetchTasks()
    } catch (error) {
      alert(error.response?.data?.error || 'Something went wrong')
    }
  }

  // Mark task as complete
  const handleComplete = async (id) => {
    try {
      await axios.patch(`${API}/${id}/complete`)
      fetchTasks()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  // Delete task
  const handleDelete = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await axios.delete(`${API}/${id}`)
        fetchTasks()
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  // Open edit form pre-filled
  const handleEdit = (task) => {
    setEditTask(task)
    setForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.split('T')[0] : ''
    })
    setShowForm(true)
  }

  // Reset & open blank add form
  const openAddForm = () => {
    setEditTask(null)
    setForm({ title: '', description: '', priority: 'medium', deadline: '' })
    setShowForm(true)
  }

  // ── FEATURE: Filter tasks by search query ──
  // This runs on the frontend — no extra API call needed
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(search.toLowerCase())
  )

  // ── Stats (based on ALL tasks, not filtered) ──
  const total     = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const pending   = total - completed

  // ── FEATURE: Progress bar percentage ──
  const progressPercent = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="app">

      {/* ── Header ── */}
      <div className="header">
        <div>
          <h1>📚 Task Tracker</h1>
          <p>Manage your daily learning tasks</p>
        </div>
        <button className="add-btn" onClick={openAddForm}>
          ➕ Add Task
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-number">{total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* ── FEATURE: Progress Bar ── */}
      {total > 0 && (
        <div className="progress-section">
          <div className="progress-header">
            <span className="progress-label">Overall Progress</span>
            <span className="progress-percent">{progressPercent}%</span>
          </div>
          <div className="progress-bar-track">
            {/* Width is set dynamically based on completion % */}
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── FEATURE: Search Bar ── */}
      <div className="search-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search tasks by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Filter Buttons ── */}
      <div className="filters">
        {['all', 'pending', 'completed'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Modal Form ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? '✏️ Edit Task' : '➕ Add New Task'}</h2>
              <button className="close-btn" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Complete React Tutorial"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Add details..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select name="priority" value={form.priority} onChange={handleChange}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn">
                {editTask ? 'Save Changes' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Task List ── */}
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty">
            <p>🎯 {search ? 'No tasks match your search.' : 'No tasks found! Add your first task.'}</p>
          </div>
        ) : (
          filteredTasks.map(task => {
            // ── FEATURE: Deadline Status Check ──
            // Only show warnings if task is NOT yet completed
            const deadlineStatus = !task.completed ? getDeadlineStatus(task.deadline) : null

            return (
              <div
                key={task._id}
                className={`task-card ${
                  task.completed
                    ? 'completed'
                    : deadlineStatus === 'overdue'
                    ? 'overdue'       // Red border for overdue
                    : task.priority   // Otherwise color by priority
                }`}
              >
                <div className="task-left">
                  <div className={`priority-dot ${task.priority}`}></div>
                  <div>
                    <div className={`task-title ${task.completed ? 'done' : ''}`}>
                      {task.title}
                    </div>

                    {task.description && (
                      <div className="task-desc">{task.description}</div>
                    )}

                    <div className="task-meta">
                      {/* Priority badge */}
                      <span className={`badge badge-${task.priority}`}>
                        {task.priority}
                      </span>

                      {/* Status badge */}
                      <span className={`badge ${task.completed ? 'badge-done' : 'badge-pending'}`}>
                        {task.completed ? '✓ Done' : 'Pending'}
                      </span>

                      {/* Deadline — with overdue/today warning */}
                      {task.deadline && (
                        <>
                          <span className="deadline">
                            📅 {new Date(task.deadline).toLocaleDateString('en-IN')}
                          </span>

                          {/* FEATURE: Show warning badges */}
                          {deadlineStatus === 'overdue' && (
                            <span className="overdue-badge">🚨 Overdue</span>
                          )}
                          {deadlineStatus === 'today' && (
                            <span className="due-today">⏰ Due Today</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="task-actions">
                  {!task.completed && (
                    <>
                      <button
                        className="btn-complete"
                        title="Mark complete"
                        onClick={() => handleComplete(task._id)}
                      >✓</button>
                      <button
                        className="btn-edit"
                        title="Edit task"
                        onClick={() => handleEdit(task)}
                      >✏️</button>
                    </>
                  )}
                  <button
                    className="btn-delete"
                    title="Delete task"
                    onClick={() => handleDelete(task._id)}
                  >🗑</button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default App
