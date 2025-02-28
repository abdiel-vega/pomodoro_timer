/*

new tasks page

*/
import TaskForm from '@/components/tasks/taskform';

export default function NewTaskPage() {
  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Task</h1>
      <TaskForm />
    </div>
  );
}