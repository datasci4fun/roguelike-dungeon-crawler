import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { friendsApi } from '../services/api';
import type { Friend, FriendRequest, PlayerSearchResult } from '../types';
import './Friends.css';

type Tab = 'friends' | 'requests' | 'search';

export function Friends() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendsApi.list(),
        friendsApi.getRequests(),
      ]);
      setFriends(friendsData.friends);
      setIncoming(requestsData.incoming);
      setOutgoing(requestsData.outgoing);
    } catch (err) {
      setError('Failed to load friends data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const data = await friendsApi.search(searchQuery.trim());
      setSearchResults(data.results);
    } catch (err) {
      setError('Search failed');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (
    action: () => Promise<{ success: boolean; message: string }>,
    successCallback?: () => void
  ) => {
    try {
      const result = await action();
      setActionMessage(result.message);
      setTimeout(() => setActionMessage(''), 3000);
      if (result.success) {
        loadData();
        if (successCallback) successCallback();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Action failed';
      setActionMessage(message);
      setTimeout(() => setActionMessage(''), 3000);
    }
  };

  const sendRequest = (userId: number) => {
    handleAction(() => friendsApi.sendRequest(userId), () => {
      setSearchResults((prev) =>
        prev.map((p) =>
          p.user_id === userId ? { ...p, is_pending: true } : p
        )
      );
    });
  };

  const acceptRequest = (userId: number) => {
    handleAction(() => friendsApi.acceptRequest(userId));
  };

  const rejectRequest = (userId: number) => {
    handleAction(() => friendsApi.rejectRequest(userId));
  };

  const removeFriend = (userId: number) => {
    if (confirm('Remove this friend?')) {
      handleAction(() => friendsApi.remove(userId));
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading && !friends.length && !incoming.length) {
    return (
      <div className="friends">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  const requestCount = incoming.length;

  return (
    <div className="friends">
      <h1>Friends</h1>

      {actionMessage && (
        <div className="action-message">{actionMessage}</div>
      )}

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Requests {requestCount > 0 && <span className="badge">{requestCount}</span>}
        </button>
        <button
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Find Players
        </button>
      </div>

      {/* Friends List */}
      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet.</p>
              <button className="btn-primary" onClick={() => setActiveTab('search')}>
                Find Players
              </button>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend.user_id} className="friend-card">
                <div className={`status-indicator ${friend.is_online ? 'online' : 'offline'}`} />
                <div className="friend-info">
                  <Link to={`/profile/${friend.user_id}`} className="friend-name">
                    {friend.display_name || friend.username}
                  </Link>
                  <div className="friend-meta">
                    <span className="username">@{friend.username}</span>
                    <span className="high-score">High: {friend.high_score.toLocaleString()}</span>
                    <span className="victories">{friend.victories} wins</span>
                  </div>
                </div>
                <div className="friend-actions">
                  {friend.is_online && (
                    <Link to="/spectate" className="btn-small btn-watch">
                      Watch
                    </Link>
                  )}
                  <button
                    className="btn-small btn-danger"
                    onClick={() => removeFriend(friend.user_id)}
                    title="Remove friend"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <div className="requests-section">
          {/* Incoming Requests */}
          <div className="requests-group">
            <h3>Incoming Requests ({incoming.length})</h3>
            {incoming.length === 0 ? (
              <p className="no-requests">No incoming requests</p>
            ) : (
              incoming.map((req) => (
                <div key={req.id} className="request-card">
                  <div className="request-info">
                    <Link to={`/profile/${req.user_id}`} className="request-name">
                      {req.display_name || req.username}
                    </Link>
                    <div className="request-meta">
                      <span>@{req.username}</span>
                      <span>High: {req.high_score.toLocaleString()}</span>
                      <span>{formatDate(req.created_at)}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-small btn-accept"
                      onClick={() => acceptRequest(req.user_id)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn-small btn-reject"
                      onClick={() => rejectRequest(req.user_id)}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Outgoing Requests */}
          <div className="requests-group">
            <h3>Sent Requests ({outgoing.length})</h3>
            {outgoing.length === 0 ? (
              <p className="no-requests">No pending requests</p>
            ) : (
              outgoing.map((req) => (
                <div key={req.id} className="request-card outgoing">
                  <div className="request-info">
                    <Link to={`/profile/${req.user_id}`} className="request-name">
                      {req.display_name || req.username}
                    </Link>
                    <div className="request-meta">
                      <span>@{req.username}</span>
                      <span>Sent {formatDate(req.created_at)}</span>
                    </div>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn-small btn-cancel"
                      onClick={() => removeFriend(req.user_id)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div className="search-section">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-search" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="search-results">
            {searchResults.length === 0 ? (
              <p className="no-results">
                {searchQuery ? 'No players found' : 'Enter a username to search'}
              </p>
            ) : (
              searchResults.map((player) => (
                <div key={player.user_id} className="player-card">
                  <div className={`status-indicator ${player.is_online ? 'online' : 'offline'}`} />
                  <div className="player-info">
                    <Link to={`/profile/${player.user_id}`} className="player-name">
                      {player.display_name || player.username}
                    </Link>
                    <div className="player-meta">
                      <span>@{player.username}</span>
                      <span>High: {player.high_score.toLocaleString()}</span>
                      <span>{player.victories} wins</span>
                      <span>{player.games_played} games</span>
                    </div>
                  </div>
                  <div className="player-actions">
                    {player.is_friend ? (
                      <span className="friend-badge">Friend</span>
                    ) : player.is_pending ? (
                      <span className="pending-badge">Pending</span>
                    ) : (
                      <button
                        className="btn-small btn-add"
                        onClick={() => sendRequest(player.user_id)}
                      >
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
