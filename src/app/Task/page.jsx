'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import { Reorder } from 'motion/react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, Trash2, Edit2, Save, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from 'next/navigation';
import { generateAISuggestion, renderFormattedText } from '@/lib/aiUtils';

export default function Task() {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [todos, setTodos] = useState([]);
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await ensureUserTasks(user.id);
    await Promise.all([
      fetchTasks(user.id),
      fetchTodos(user.id)
    ]);
  };

  const ensureUserTasks = async (userId) => {
    const { data: tableExists } = await supabase
      .from('user_tasks')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!tableExists || tableExists.length === 0) {
      const { error } = await supabase
        .from('user_tasks')
        .insert([
          { 
            user_id: userId,
            tasks: [],
            order: 0
          }
        ]);

      if (error) {
        console.error('Error creating user tasks:', error);
      }
    }
  };

  const fetchTasks = async (userId) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_tasks')
      .select('tasks, order')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching tasks:', error);
    } else {
      const sortedTasks = data.tasks ? [...data.tasks].sort((a, b) => a.order - b.order) : [];
      setTasks(sortedTasks);
    }
    setIsLoading(false);
  };

  const fetchTodos = async (userId) => {
    const { data, error } = await supabase
      .from('user_todos')
      .select('todos')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      setTodos(data.todos || []);
    }
  };

  const generateSuggestion = async () => {
    setIsGeneratingSuggestion(true);
    const result = await generateAISuggestion({
      tasks,
      todos,
      context: 'task'
    });

    if (result.success) {
      setAiSuggestion(result.suggestion);
    } else {
      setAiSuggestion(result.error);
    }
    setIsGeneratingSuggestion(false);
  };

  const handleAdd = async () => {
    if (!input.trim()) return;
    if (!user) return;

    const task = {
      id: Date.now().toString(),
      text: input,
      priority: 1,
      status: 'pending',
      title: input.split(' ').slice(0, 5).join(' '),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_tasks')
        .select('tasks')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedTasks = [...(currentData?.tasks || []), task];

      const { error: updateError } = await supabase
        .from('user_tasks')
        .update({ tasks: updatedTasks })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setTasks(updatedTasks);
      setInput('');
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    setIsLoading(true);
    
    const updatedTasks = tasks
      .filter(task => task.id !== id)
      .map((task, index) => ({
        ...task,
        order: index
      }));

    const { error } = await supabase
      .from('user_tasks')
      .update({ 
        tasks: updatedTasks,
        order: updatedTasks.length
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting task:', error);
    } else {
      fetchTasks(user.id);
    }
    setIsLoading(false);
  };

  const handleUpdate = async (id, updates) => {
    if (!user) return;
    setIsLoading(true);
    
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    );

    const { error } = await supabase
      .from('user_tasks')
      .update({ tasks: updatedTasks })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating task:', error);
    } else {
      fetchTasks(user.id);
    }
    setIsLoading(false);
  };

  const handleReorder = async (newOrder) => {
    if (!user) return;
    
    const updatedTasks = newOrder.map((task, index) => ({
      ...task,
      order: index
    }));

    const { error } = await supabase
      .from('user_tasks')
      .update({ 
        tasks: updatedTasks,
        order: updatedTasks.length
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating order:', error);
    } else {
      setTasks(updatedTasks);
    }
  };

  const handleUseSuggestion = async (suggestion) => {
    if (!user) return;

    // Extract the task title and remove ** markers
    const taskTitle = suggestion.replace(/\*\*/g, '').split('(')[0].trim();
    
    // Parse priority from suggestion
    const priorityMatch = suggestion.match(/\((High|Medium|Low) Priority/);
    const priority = priorityMatch 
      ? priorityMatch[1].toLowerCase() === 'high' ? 1 
        : priorityMatch[1].toLowerCase() === 'medium' ? 2 
        : 3
      : 2;

    // Parse estimated time from suggestion
    const timeMatch = suggestion.match(/Est\. Time: (\d+)\s*(?:minutes?|mins?|m)/);
    const estimatedTime = timeMatch ? parseInt(timeMatch[1]) : null;

    const task = {
      id: Date.now().toString(),
      text: suggestion,
      title: taskTitle,
      priority,
      estimated_time: estimatedTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_tasks')
        .select('tasks')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedTasks = [...(currentData?.tasks || []), task];

      const { error: updateError } = await supabase
        .from('user_tasks')
        .update({ tasks: updatedTasks })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setTasks(updatedTasks);
      setAiSuggestion(null);
    } catch (error) {
      console.error('Error adding task from suggestion:', error);
    }
  };

  const getPriorityColor = (priority) => {
    const priorityString = typeof priority === 'string' ? priority.toLowerCase() : 'medium';
    switch (priorityString) {
      case 'high':
        return 'bg-red-100 border-red-200';
      case 'medium':
        return 'bg-yellow-100 border-yellow-200';
      case 'low':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };
  

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">
              Task Manager
            </h1>
            <Button
              onClick={generateSuggestion}
              disabled={isGeneratingSuggestion}
              className="flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingSuggestion ? 'Generating...' : 'Get AI Suggestion'}
            </Button>
          </div>

          {aiSuggestion && (
            <Card className="p-4 mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-purple-700 mb-1">AI Suggestion</h3>
                  <p className="text-gray-700">{renderFormattedText(aiSuggestion)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-purple-600"
                    onClick={() => handleUseSuggestion(aiSuggestion)}
                  >
                    Add as Task
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3 mb-6">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a new task..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Task'}
            </Button>
          </div>

          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              onClick={() => setFilter('pending')}
            >
              Pending
            </Button>
            <Button
              variant={filter === 'done' ? 'default' : 'outline'}
              onClick={() => setFilter('done')}
            >
              Done
            </Button>
          </div>

          <Reorder.Group
            axis="y"
            values={filteredTasks}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                getPriorityColor={getPriorityColor}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </Reorder.Group>

          {filteredTasks.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No Data Available</p>
              <p className="text-sm mt-2">Add your first task or get an AI suggestion!</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TaskItem({ task, onDelete, onUpdate, getPriorityColor, getStatusIcon }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newText, setNewText] = useState(task.text);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [task.text]);

  const handleSave = () => {
    onUpdate(task.id, { text: newText });
    setIsEditing(false);
  };

  const toggleStatus = () => {
    onUpdate(task.id, { 
      status: task.status === 'done' ? 'pending' : 'done' 
    });
  };

  const updatePriority = (priority) => {
    onUpdate(task.id, { priority });
  };

  return (
    <Reorder.Item value={task} id={task.id}>
      <Card className={`p-4 hover:shadow-md transition-shadow ${getPriorityColor(task.priority)}`}>
        <div className="flex items-start gap-4">
          <div className="flex items-center gap-2 pt-1">
            <button onClick={toggleStatus}>
              {getStatusIcon(task.status)}
            </button>
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full"
                autoFocus
              />
            ) : (
              <div>
                <p 
                  ref={textRef}
                  className={`text-gray-800 font-medium ${
                    !isExpanded ? 'line-clamp-2' : ''
                  } ${task.status === 'done' ? 'line-through' : ''}`}
                >
                  {renderFormattedText(task.text)}
                </p>
                {isOverflowing && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        Show Less <ChevronUp className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={task.priority}
              onChange={(e) => updatePriority(e.target.value)}
              className="text-sm border rounded p-1"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSave}
                className="text-green-600"
              >
                <Save className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-blue-600"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
}
