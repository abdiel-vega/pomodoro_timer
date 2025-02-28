/*

home page

*/
import Timer from '@/components/pomodoro/timer';
import TaskList from '@/components/tasks/tasklist';

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="mx-auto w-full max-w-md">
        <Timer />
      </section>
      
      <section className="mx-auto w-full max-w-3xl">
        <TaskList />
      </section>
    </div>
  );
}
