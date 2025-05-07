'use client';
import { useState, useEffect } from 'react';
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { supabase } from '@/lib/supabaseClient'
import { useTheme } from "next-themes"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { Sparkles } from 'lucide-react'

import UsersTable from "../../components/usersTable/page"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const [taskStats, setTaskStats] = useState({
    total: 0,
    pending: 0,
    done: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [user, setUser] = useState(null);
  const { theme } = useTheme();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUser(user);
    fetchTaskStats(user.id);
  };

  const fetchTaskStats = async (userId) => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('user_tasks')
        .select('tasks')
        .eq('user_id', userId)
        .single();

      if (tasksError) throw tasksError;

      const tasks = tasksData.tasks || [];
      const total = tasks.length;
      const pending = tasks.filter(task => task.status === 'pending').length;
      const done = tasks.filter(task => task.status === 'done').length;

      setTaskStats({ total, pending, done });

      // Prepare weekly data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const weeklyStats = last7Days.map(date => {
        const dayTasks = tasks.filter(task => 
          new Date(task.created_at).toISOString().split('T')[0] === date
        );
        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          completed: dayTasks.filter(task => task.status === 'done').length,
          pending: dayTasks.filter(task => task.status === 'pending').length
        };
      });

      setWeeklyData(weeklyStats);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const pieData = [
    { name: 'Pending', value: taskStats.pending },
    { name: 'Completed', value: taskStats.done }
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card className="p-2 aspect-video mt-1.5">
              <h3 className="text-lg font-semibold mb-2">Task Overview</h3>
              <div className="h-[calc(120%-2rem)]">
                {taskStats.total > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                    <Sparkles className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Data Available</p>
                    <p className="text-sm mt-2">No tasks to display</p>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4 mt-1">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs">{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 aspect-video mt-1.5 h-[98%] w-[98%]">
              <h3 className="text-lg font-semibold mb-2">Weekly Progress</h3>
              <div className="h-[calc(100%-2rem)]">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="80%">
                    <LineChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#00C49F" 
                        name="Completed"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="pending" 
                        stroke="#FFBB28" 
                        name="Pending"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                    <Sparkles className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Data Available</p>
                    <p className="text-sm mt-2">No completion data to display</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4 aspect-video mt-1.5 h-[98%] w-[98%]">
              <h3 className="text-lg font-semibold mb-2">Task Distribution</h3>
              <div className="h-[calc(100%-2rem)]">
                {weeklyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="completed" fill="#00C49F" name="Completed" />
                      <Bar dataKey="pending" fill="#FFBB28" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex flex-col items-center justify-center text-gray-500">
                    <Sparkles className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No Data Available</p>
                    <p className="text-sm mt-2">No items to display</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
           <UsersTable />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
