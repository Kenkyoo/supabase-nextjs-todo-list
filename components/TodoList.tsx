import { Database } from "@/lib/schema";
import { Session, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";

type Todos = Database["public"]["Tables"]["todos"]["Row"];

export default function TodoList({ session }: { session: Session }) {
  const supabase = useSupabaseClient<Database>();
  const [todos, setTodos] = useState<Todos[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [errorText, setErrorText] = useState("");

  const user = session.user;

  useEffect(() => {
    const fetchTodos = async () => {
      const { data: todos, error } = await supabase
        .from("todos")
        .select("*")
        .order("id", { ascending: true });

      if (error) console.log("error", error);
      else setTodos(todos);
    };

    fetchTodos();
  }, [supabase]);

  const addTodo = async (taskText: string) => {
    let task = taskText.trim();
    if (task.length) {
      const { data: todo, error } = await supabase
        .from("todos")
        .insert({ task, user_id: user.id })
        .select()
        .single();

      if (error) {
        setErrorText(error.message);
      } else {
        setTodos([...todos, todo]);
        setNewTaskText("");
      }
    }
  };

  const deleteTodo = async (id: number) => {
    try {
      await supabase.from("todos").delete().eq("id", id).throwOnError();
      setTodos(todos.filter((x) => x.id != id));
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full min-h-96">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-4 italic">
        📝 My reading List
      </h1>

      <div className="flex justify-center items-center w-full mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo(newTaskText);
          }}
          className="flex gap-2 my-2"
        >
          <input
            className="bg-white text-black flex-grow md:w-80 p-2 rounded-l-md border border-gray-300 focus:outline-none"
            type="text"
            placeholder="The Hobbit, Harry Potter, etc"
            value={newTaskText}
            onChange={(e) => {
              setErrorText("");
              setNewTaskText(e.target.value);
            }}
          />
          <button
            className="bg-indigo-500 text-white px-4 py-2 rounded-r-md hover:bg-indigo-600"
            type="submit"
          >
            Add
          </button>
        </form>
      </div>
      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul id="taskList" className="list-disc space-y-2">
          {todos.map((todo) => (
            <Todo
              key={todo.id}
              todo={todo}
              onDelete={() => deleteTodo(todo.id)}
            />
          ))}
        </ul>
      </div>
      {!!errorText && <Alert text={errorText} />}
    </div>
  );
}

const Todo = ({ todo, onDelete }: { todo: Todos; onDelete: () => void }) => {
  const supabase = useSupabaseClient<Database>();
  const [isCompleted, setIsCompleted] = useState(todo.is_complete);

  const toggle = async () => {
    try {
      const { data } = await supabase
        .from("todos")
        .update({ is_complete: !isCompleted })
        .eq("id", todo.id)
        .throwOnError()
        .select()
        .single();

      if (data) setIsCompleted(data.is_complete);
    } catch (error) {
      console.log("error", error);
    }
  };

  return (
    <li className="flex items center justify-between gap-4 border border-indigo-300 rounded p-2">
      <div className="flex items-center gap-4">
        <div>
          <input
            className="w-6 h-6 ml-2 mt-2 border-2 hover:border-black rounded cursor-pointer"
            onChange={() => toggle()}
            type="checkbox"
            checked={isCompleted ? true : false}
          />
        </div>
        <div className="text-gray-800 text-1xl ms-2 italic">{todo.task}</div>
      </div>
      <div>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="w-6 h-6 ml-2 mt-2 border-2 hover:border-black rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="gray"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </li>
  );
};

const Alert = ({ text }: { text: string }) => (
  <div className="rounded-md bg-red-100 p-4 my-3">
    <div className="text-sm leading-5 text-red-700">{text}</div>
  </div>
);
