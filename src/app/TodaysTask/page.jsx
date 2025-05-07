'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card } from '@/components/ui/card';
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Clock, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useRouter } from 'next/navigation';
import { useTheme } from "next-themes";
import { getPriorityColors } from '@/lib/themeUtils';

function TaskCard({ item, isLoading, handleMarkAsDone }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const textRef = useRef(null);
  const { theme } = useTheme();
  const colors = getPriorityColors(item.priority, theme);

  useEffect(() => {
    if (textRef.current) {
      setIsOverflowing(textRef.current.scrollHeight > textRef.current.clientHeight);
    }
  }, [item.text]);

  return (
    <Card 
      className={`p-4 hover:shadow-md transition-shadow ${colors.card} relative`}
    >
      <div className="absolute -top-7 left-4 z-0">
        <div className={`${colors.number} w-[100%] h-8 p-2.5 rounded-t-2xl flex items-center justify-center font-bold shadow-md`}>
          {item.priority}
        </div>
      </div>
      <div className="flex items-start gap-4 mt-2">
        <div className="flex items-center gap-2 pt-1">
          <button 
            onClick={() => handleMarkAsDone(item, item.type)}
            disabled={isLoading}
            className="disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            ) : (
              <Clock className="w-5 h-5 text-yellow-500" />
            )}
          </button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p 
                ref={textRef}
                className={`${colors.text.primary} font-medium ${
                  !isExpanded ? 'line-clamp-2' : ''
                }`}
              >
                {item.text}
              </p>
              {isOverflowing && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`${colors.text.accent} hover:opacity-80 text-sm mt-1 flex items-center gap-1`}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsDone(item, item.type)}
              disabled={isLoading}
              className="text-green-600 dark:text-green-400 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              colors.badge[item.type === 'task' ? 'task' : 'todo']
            }`}>
              {item.type === 'task' ? 'Task' : 'Teaching Goal'}
            </span>
            {item.estimated_time && (
              <span className={`text-xs ${colors.text.secondary}`}>
                Est. {item.estimated_time} min
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function TodaysTask() {
  const [tasks, setTasks] = useState([]);
  const [todos, setTodos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const { theme } = useTheme();

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
    fetchTasks(user.id);
    fetchTodos(user.id);
  };

  const fetchTasks = async (userId) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('tasks')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Filter only pending tasks and sort by priority
      const pendingTasks = data.tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => a.priority - b.priority);

      setTasks(pendingTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTodos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      // Filter only pending todos and sort by priority
      const pendingTodos = data.todos
        .filter(todo => todo.status === 'pending')
        .sort((a, b) => a.priority - b.priority);

      setTodos(pendingTodos);
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const handleMarkAsDone = async (item, type) => {
    if (!user) return;
    setIsLoading(true);

    try {
      if (type === 'task') {
        const { data: currentData, error: fetchError } = await supabase
          .from('user_tasks')
          .select('tasks')
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const updatedTasks = currentData.tasks.map(task => 
          task.id === item.id 
            ? { ...task, status: 'done', completed_at: new Date().toISOString() }
            : task
        );

        const { error: updateError } = await supabase
          .from('user_tasks')
          .update({ tasks: updatedTasks })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        setTasks(updatedTasks.filter(task => task.status === 'pending'));
      } else {
        const { data: currentData, error: fetchError } = await supabase
          .from('user_todos')
          .select('todos')
          .eq('user_id', user.id)
          .single();

        if (fetchError) throw fetchError;

        const updatedTodos = currentData.todos.map(todo => 
          todo.id === item.id 
            ? { ...todo, status: 'done', completed_at: new Date().toISOString() }
            : todo
        );

        const { error: updateError } = await supabase
          .from('user_todos')
          .update({ todos: updatedTodos })
          .eq('user_id', user.id);

        if (updateError) throw updateError;

        setTodos(updatedTodos.filter(todo => todo.status === 'pending'));
      }
    } catch (error) {
      console.error('Error marking item as done:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const allPendingItems = [
    ...tasks.map(task => ({ ...task, type: 'task' })),
    ...todos.map(todo => ({ ...todo, type: 'todo' }))
  ].sort((a, b) => a.priority - b.priority);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">
              Today's Tasks
            </h1>
          </div>

          <div className="space-y-4">
            {allPendingItems.map((item) => (
              <TaskCard
                key={item.id}
                item={item}
                isLoading={isLoading}
                handleMarkAsDone={handleMarkAsDone}
              />
            ))}

            {allPendingItems.length === 0 && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No Data Available</p>
                <p className="text-sm mt-2">No tasks or teaching goals for today</p>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
