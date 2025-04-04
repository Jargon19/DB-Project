// Dashboard.jsx
import { Link } from 'react-router-dom';

function Dashboard({ user }) {
  return (
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-2xl font-bold">Welcome to your Dashboard, {user.email}</h2>
      <div className="mt-4">
        <Link to="/event/1" className="text-blue-500">View Event 1</Link>
        <br />
        <Link to="/event/2" className="text-blue-500">View Event 2</Link>
      </div>
    </div>
  );
}

export default Dashboard;
