/*

tasks page

*/
import TaskForm from '@/components/tasks/taskform';

export default function EditTaskPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Task</h1>
      <TaskForm taskId={params.id} />
    </div>
  );
}
