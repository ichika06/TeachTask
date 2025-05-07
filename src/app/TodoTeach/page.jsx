'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import { Reorder } from 'motion/react';
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2, Trash2, Edit2, Save, Clock, AlertCircle } from "lucide-react";
import { useRouter } from 'next/navigation';
import { generateAISuggestion, renderFormattedText } from '@/lib/aiUtils';

export default function TodoTeach() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'done'
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
    await ensureUserTable(user.id);
    fetchTodos(user.id);
  };

  const ensureUserTable = async (userId) => {
    // Check if table exists
    const { data: tableExists } = await supabase
      .from('user_todos')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!tableExists || tableExists.length === 0) {
      // Create initial record for the user with empty todos array
      const { error } = await supabase
        .from('user_todos')
        .insert([
          { 
            user_id: userId,
            todos: [],
            order: 0
          }
        ]);

      if (error) {
        console.error('Error creating user table:', error);
      }
    }
  };

  const fetchTodos = async (userId) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_todos')
      .select('todos, order')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching todos:', error);
    } else {
      // Sort todos by order if they exist
      const sortedTodos = data.todos ? [...data.todos].sort((a, b) => a.order - b.order) : [];
      setTodos(sortedTodos);
    }
    setIsLoading(false);
  };

  const generateSuggestion = async () => {
    setIsGeneratingSuggestion(true);
    const result = await generateAISuggestion({
      todos,
      context: 'todo'
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

    const todo = {
      id: Date.now().toString(),
      text: input,
      title: input.split(' ').slice(0, 5).join(' '), // Add title from first 5 words
      priority: 1,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedTodos = [...(currentData?.todos || []), todo];

      const { error: updateError } = await supabase
        .from('user_todos')
        .update({ todos: updatedTodos })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setTodos(updatedTodos);
      setInput('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Remove the todo and update order and priority
      const updatedTodos = currentData.todos
        .filter(todo => todo.id !== id)
        .map((todo, index) => ({
          ...todo,
          order: index,
          priority: index + 1 // Update priority based on new position
        }));

      const { error: updateError } = await supabase
        .from('user_todos')
        .update({ 
          todos: updatedTodos
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id, updates) => {
    if (!user) return;
    setIsLoading(true);
    
    try {
      // First, get the current todos
      const { data: currentData, error: fetchError } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update the specific todo in the array
      const updatedTodos = currentData.todos.map(todo => 
        todo.id === id ? { ...todo, ...updates } : todo
      );

      // Update the entire todos array
      const { error: updateError } = await supabase
        .from('user_todos')
        .update({ 
          todos: updatedTodos
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error updating todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (newOrder) => {
    if (!user) return;

    const updatedTodos = newOrder.map((todo, index) => ({
      ...todo,
      order: index,
      priority: index + 1 // Update priority based on new position
    }));

    const { error } = await supabase
      .from('user_todos')
      .update({ 
        todos: updatedTodos,
        order: updatedTodos.length
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating order:', error);
    } else {
      setTodos(updatedTodos);
    }
  };

  const handleUseSuggestion = async (suggestion) => {
    if (!user) return;

    // Extract the todo title and remove ** markers
    const todoTitle = suggestion.replace(/\*\*/g, '').split('(')[0].trim();
    
    // Parse priority from suggestion
    const priorityMatch = suggestion.match(/\((High|Medium|Low) Priority/);
    const priority = priorityMatch 
      ? priorityMatch[1].toLowerCase() === 'high' ? 1 
        : priorityMatch[1].toLowerCase() === 'medium' ? 2 
        : 3
      : 2;

    const todo = {
      id: Date.now().toString(),
      text: suggestion,
      title: todoTitle,
      priority,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      const { data: currentData, error: fetchError } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      const updatedTodos = [...(currentData?.todos || []), todo];

      const { error: updateError } = await supabase
        .from('user_todos')
        .update({ todos: updatedTodos })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setTodos(updatedTodos);
      setAiSuggestion(null);
    } catch (error) {
      console.error('Error adding todo from suggestion:', error);
    }
  };

  const handleMarkAll = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      // First, get the current todos
      const { data: currentData, error: fetchError } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Update all todos to done
      const updatedTodos = currentData.todos.map(todo => ({
        ...todo,
        status: 'done',
        completed_at: new Date().toISOString()
      }));

      // Update the entire todos array
      const { error: updateError } = await supabase
        .from('user_todos')
        .update({ 
          todos: updatedTodos
        })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error marking all todos:', error);
    } finally {
      setIsLoading(false);
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 border-red-200';
      case 2:
        return 'bg-yellow-100 border-yellow-200';
      case 3:
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getPriorityNumberColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-500 text-white';
      case 2:
        return 'bg-yellow-500 text-white';
      case 3:
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return todo.status === filter;
  });

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">
              TeachTask TODO
            </h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleMarkAll}
                disabled={isLoading || todos.length === 0}
                className="flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark All Done
              </Button>
              <Button
                onClick={generateSuggestion}
                disabled={isGeneratingSuggestion}
                className="flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingSuggestion ? 'Generating...' : 'Get AI Suggestion'}
              </Button>
            </div>
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
            values={filteredTodos}
            onReorder={handleReorder}
            className="space-y-3"
          >
            {filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                getStatusIcon={getStatusIcon}
              />
            ))}
          </Reorder.Group>

          {filteredTodos.length === 0 && !isLoading && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No Data Available</p>
              <p className="text-sm mt-2">Add your first teaching goal or get an AI suggestion!</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function TodoItem({ todo, onDelete, onUpdate, getStatusIcon }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newText, setNewText] = useState(todo.text);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = () => {
    onUpdate(todo.id, { text: newText });
    setIsEditing(false);
  };

  const toggleStatus = async () => {
    setIsUpdating(true);
    const newStatus = todo.status === 'done' ? 'pending' : 'done';
    await onUpdate(todo.id, { 
      status: newStatus,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null
    });
    setIsUpdating(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 border-red-200';
      case 2:
        return 'bg-yellow-100 border-yellow-200';
      case 3:
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const getPriorityNumberColor = (priority) => {
    switch (priority) {
      case 1:
        return 'bg-red-500 text-white';
      case 2:
        return 'bg-yellow-500 text-white';
      case 3:
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Reorder.Item value={todo} id={todo.id}>
      <Card className={`p-4 hover:shadow-md transition-shadow ${getPriorityColor(todo.priority)} relative`}>
        <div className="absolute -top-3 left-4">
          <div className={`${getPriorityNumberColor(todo.priority)} w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-md`}>
            {todo.priority}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleStatus}
              disabled={isUpdating}
              className="disabled:opacity-50"
            >
              {isUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              ) : (
                getStatusIcon(todo.status)
              )}
            </button>
          </div>
          <div className="flex-1">
            {isEditing ? (
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                className="w-full"
                autoFocus
              />
            ) : (
              <p className={`text-gray-800 ${todo.status === 'done' ? 'line-through' : ''}`}>
                {renderFormattedText(todo.text)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              onClick={() => onDelete(todo.id)}
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
