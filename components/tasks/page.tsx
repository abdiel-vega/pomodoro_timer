/*

tasks page

*/
import TaskList from '@/components/tasks/tasklist';

export default function TasksPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Task Manager</h1>
      <TaskList />
    </div>
  );
}