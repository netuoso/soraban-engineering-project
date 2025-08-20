import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container mt-5">
      <h1>Welcome to Soraban</h1>
      <p>Hello, {user?.email || 'Guest'}!</p>
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Transactions</h5>
              <p className="card-text">View and manage your transactions</p>
              <a href="/transactions" className="btn btn-primary">Go to Transactions</a>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Categories</h5>
              <p className="card-text">Manage your transaction categories</p>
              <a href="/categories" className="btn btn-primary">Go to Categories</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
