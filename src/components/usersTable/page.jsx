'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Clock, Sparkles } from "lucide-react"
import { supabase } from '@/lib/supabaseClient'
import { useTheme } from "next-themes"

export default function UsersTable() {
  const [tasks, setTasks] = useState([])
  const [todos, setTodos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)
  const { theme } = useTheme()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    await Promise.all([fetchTasks(user.id), fetchTodos(user.id)])
  }

  const fetchTasks = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('tasks')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      const tasksWithType = (data.tasks || []).map(task => ({ ...task, type: 'task' }))
      setTasks(tasksWithType)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchTodos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_todos')
        .select('todos')
        .eq('user_id', userId)
        .single()

      if (error) throw error
      const todosWithType = (data.todos || []).map(todo => ({ ...todo, type: 'todo' }))
      setTodos(todosWithType)
    } catch (error) {
      console.error('Error fetching todos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const allItems = [...tasks, ...todos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  const stats = {
    totalTasks: tasks.length,
    totalTodos: todos.length,
    completedTasks: tasks.filter(task => task.status === 'done').length,
    completedTodos: todos.filter(todo => todo.status === 'done').length,
    pendingTasks: tasks.filter(task => task.status === 'pending').length,
    pendingTodos: todos.filter(todo => todo.status === 'pending').length
  }

  const getPriorityColor = (priority) => {
    const isDark = theme === 'dark'
    switch (priority) {
      case 1: return isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
      case 2: return isDark ? 'bg-yellow-900/30 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
      case 3: return isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
      default: return isDark ? 'bg-gray-900/30 text-gray-300' : 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-[98%] m-auto mt-1.5 h-[98%]">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Task & Teaching Goals Overview</CardTitle>
      </CardHeader>
      <CardContent className='overflow-y-scroll'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody >
            {!isLoading ? (
              allItems.length > 0 ? (
                allItems.map((item) => (
                  <TableRow key={item.id} className='cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-700'>
                    <TableCell className="font-medium">
                      {item.title || item.text.split(' ').slice(0, 5).join(' ')}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.type === 'task' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                      }`}>
                        {item.type === 'task' ? 'Task' : 'Teaching Goal'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                        Priority {item.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="text-sm capitalize">{item.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Data Available</p>
                    <p className="text-sm mt-2">No tasks or teaching goals found</p>
                  </TableCell>
                </TableRow>
              )
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 space-y-2">
                  <Skeleton className="w-full h-[30px] rounded-b-xs" />
                  <Skeleton className="w-full h-[30px] rounded-xs" />
                  <Skeleton className="w-full h-[30px] rounded-xs" />
                  <Skeleton className="w-full h-[30px] rounded-xs" />
                  <Skeleton className="w-full h-[30px] rounded-xs" />
                  <Skeleton className="w-full h-[30px] rounded-xs" />
                  <Skeleton className="w-full h-[30px] rounded-t-xs" />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex gap-8">
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Tasks</h4>
            <p className="text-2xl font-bold">{stats.totalTasks}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{stats.completedTasks} completed</span>
              <Clock className="w-4 h-4 text-yellow-500 ml-2" />
              <span>{stats.pendingTasks} pending</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Teaching Goals</h4>
            <p className="text-2xl font-bold">{stats.totalTodos}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>{stats.completedTodos} completed</span>
              <Clock className="w-4 h-4 text-yellow-500 ml-2" />
              <span>{stats.pendingTodos} pending</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Items</h4>
          <p className="text-2xl font-bold">{stats.totalTasks + stats.totalTodos}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>{stats.completedTasks + stats.completedTodos} completed</span>
            <Clock className="w-4 h-4 text-yellow-500 ml-2" />
            <span>{stats.pendingTasks + stats.pendingTodos} pending</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
