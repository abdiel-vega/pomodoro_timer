import { createClient } from '@/utils/supabase/server';

export default async function Notes() {
  const supabase = await createClient();
  const { data: notes } = await supabase.from("notes").select();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-5">My Notes</h1>
      
      {notes && notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div key={note.id} className="p-4 border rounded-lg bg-card">
              <p className="text-lg">{note.title}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No notes found.</p>
      )}
    </div>
  );
}