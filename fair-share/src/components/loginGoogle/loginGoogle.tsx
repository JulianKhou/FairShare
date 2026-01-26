import { useAuth } from '../../hooks/auth/useAuth';
import { signInWithGoogle, signOut } from '../../services/supabase/auth';

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div>Initialisiere Session...</div>;

  return (
    <div style={{ padding: '20px' }}>
      {!user ? (
        <button onClick={signInWithGoogle}>Mit YouTube anmelden</button>
      ) : (
        <div>
          <h1>Eingeloggt als: {user.user_metadata.full_name}</h1>
          <button onClick={signOut}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default App;