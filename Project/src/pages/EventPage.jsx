// EventPage.jsx
import { useParams } from 'react-router-dom';

function EventPage() {
  const { id } = useParams(); // Get the event ID from the URL

  return (
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-2xl font-bold">Event {id}</h2>
      <p className="mt-4">Details about event {id} will go here.</p>
      <div className="mt-4">
        <label htmlFor="comment" className="mr-2">Add a Comment:</label>
        <textarea id="comment" rows="4" className="border p-2 mb-2"></textarea>
        <br />
        <button className="bg-blue-500 text-white p-2">Submit Comment</button>
      </div>
      <div className="mt-4">
        <label htmlFor="rating" className="mr-2">Rate this Event:</label>
        <input type="number" id="rating" min="1" max="5" className="border p-2" />
      </div>
    </div>
  );
}

export default EventPage;
