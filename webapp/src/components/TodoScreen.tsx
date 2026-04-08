import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare, Menu } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';

export default function TodoScreen() {
  const { todos, addTodo, toggleTodo, deleteTodo, setSidebarOpen } = useTripStore();
  const [newTodo, setNewTodo] = useState('');

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim());
    setNewTodo('');
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="screen-header glass-effect" style={{ marginBottom: '0' }}>
        <button 
          className="header-icon-btn"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', color: '#FFF', margin: 0 }}>
            Todo List
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {completedCount} of {todos.length} tasks completed
          </p>
        </div>
      </div>

      <div style={{ padding: '24px', paddingBottom: '120px' }}>
        {/* Input Area */}
      <div style={{ 
        display: 'flex', gap: '12px', marginBottom: '32px', 
        background: 'rgba(255,255,255,0.05)', padding: '8px', 
        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <input 
          type="text" 
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a task..."
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ 
            flex: 1, background: 'transparent', border: 'none', 
            color: '#fff', fontSize: '16px', padding: '12px',
            outline: 'none'
          }}
        />
        <button 
          onClick={handleAdd}
          disabled={!newTodo.trim()}
          style={{ 
            width: '44px', height: '44px', borderRadius: '12px', 
            background: newTodo.trim() ? 'var(--sys-blue)' : 'rgba(255,255,255,0.1)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            border: 'none', cursor: 'pointer'
          }}
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Todo List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {todos.length === 0 ? (
          <div style={{ 
            textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
          }}>
            <CheckSquare size={48} opacity={0.2} />
            <p style={{ fontSize: '15px' }}>No tasks yet. Stay organized for your trip!</p>
          </div>
        ) : (
          todos.sort((a, b) => b.createdAt - a.createdAt).map(todo => (
            <div 
              key={todo.id}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '16px', 
                background: 'var(--sys-bg-elevated-1)', padding: '16px', 
                borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.2s ease'
              }}
            >
              <button 
                onClick={() => toggleTodo(todo.id)}
                style={{ 
                  background: 'transparent', border: 'none', padding: 0, 
                  color: todo.completed ? 'var(--sys-blue)' : 'var(--sys-label-tertiary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center'
                }}
              >
                {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
              </button>
              
              <span style={{ 
                flex: 1, fontSize: '16px', color: todo.completed ? 'var(--sys-label-tertiary)' : '#fff',
                textDecoration: todo.completed ? 'line-through' : 'none',
                transition: 'all 0.2s ease'
              }}>
                {todo.text}
              </span>

              <button 
                onClick={() => deleteTodo(todo.id)}
                style={{ 
                  background: 'rgba(255, 69, 58, 0.1)', border: 'none', 
                  padding: '8px', borderRadius: '10px', color: '#FF453A',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
