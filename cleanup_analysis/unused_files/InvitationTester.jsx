import React, { useState, useEffect } from 'react';
import { InvitationService } from '../services/invitationService';
import { useAuth } from '../AuthContext';
import { supabase } from '../supabaseClient';

const InvitationTester = () => {
  const { session } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testRole, setTestRole] = useState('employee');
  const [message, setMessage] = useState('');

  // Load existing invitations
  const loadInvitations = async () => {
    try {
      setLoading(true);
      const data = await InvitationService.getAllInvitations();
      setInvitations(data);
      setMessage('✅ Invitations loaded successfully!');
    } catch (error) {
      setMessage(`❌ Error loading invitations: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test creating an invitation
  const testCreateInvitation = async () => {
    try {
      setLoading(true);
      const invitation = await InvitationService.createInvitation(
        testEmail,
        testRole,
        session.user.id
      );
      setMessage(`✅ Invitation created successfully! ID: ${invitation.id}`);
      loadInvitations(); // Reload the list
    } catch (error) {
      if (error.message.includes('invitación pendiente ya existe') || 
          error.message.includes('pending invitation already exists')) {
        setMessage(`⚠️ Invitation already exists for ${testEmail}. Try a different email or cancel the existing one first.`);
      } else {
        setMessage(`❌ Error creating invitation: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test creating with random email to avoid duplicates (DB ONLY)
  const testCreateWithRandomEmailDBOnly = async () => {
    const randomEmail = `test${Math.floor(Math.random() * 1000)}@example.com`;
    setTestEmail(randomEmail);
    try {
      setLoading(true);
      
      // Create invitation directly via supabase without sending email
      const { data, error } = await supabase
        .from('invitations')
        .insert([
          {
            email: randomEmail,
            role: testRole,
            invited_by: session.user.id,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setMessage(`✅ Database invitation created successfully! ID: ${data.id} for ${randomEmail}`);
      loadInvitations(); // Reload the list
    } catch (error) {
      setMessage(`❌ Error creating database invitation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test creating invitation with manual email marking (bypass Edge Function completely)
  const testCreateInvitationNoEmail = async () => {
    try {
      setLoading(true);
      
      // Create invitation directly via supabase without sending email
      const { data, error } = await supabase
        .from('invitations')
        .insert([
          {
            email: testEmail,
            role: testRole,
            invited_by: session.user.id,
            status: 'pending',
            email_sent_at: new Date().toISOString() // Mark as email sent immediately
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      setMessage(`✅ Invitation created and marked as emailed! ID: ${data.id} for ${testEmail}`);
      loadInvitations(); // Reload the list
    } catch (error) {
      setMessage(`❌ Error creating invitation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const testEdgeFunctionConnectivity = async () => {
    try {
      setLoading(true);
      
      // Try a simple fetch to the Edge Function endpoint
      const response = await fetch('https://gbdmutklayjmatlquktt.supabase.co/functions/v1/send-invitation', {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        setMessage(`✅ Edge Function is accessible! Status: ${response.status}`);
      } else {
        setMessage(`⚠️ Edge Function responded but with error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setMessage(`❌ Cannot reach Edge Function: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  const testCancelInvitation = async (invitationId) => {
    try {
      setLoading(true);
      await InvitationService.cancelInvitation(invitationId);
      setMessage(`✅ Invitation ${invitationId} canceled successfully!`);
      loadInvitations(); // Reload the list
    } catch (error) {
      setMessage(`❌ Error canceling invitation: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadInvitations();
    }
  }, [session]);

  if (!session?.user) {
    return <div className="p-4 text-red-600">❌ No user session found</div>;
  }

  const userRole = session.user.user_metadata?.role;
  const canManageInvitations = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-blue-800 mb-6">🧪 Invitation System Tester</h2>
      
      {/* User Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 mb-2">Current User:</h3>
        <p><strong>Email:</strong> {session.user.email}</p>
        <p><strong>Role:</strong> {userRole || 'No role assigned'}</p>
        <p><strong>Can manage invitations:</strong> {canManageInvitations ? '✅ Yes' : '❌ No'}</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Create Invitation Test */}
      {canManageInvitations && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">🚀 Test Create Invitation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="email"
              placeholder="Email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={testRole}
              onChange={(e) => setTestRole(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={testCreateInvitation}
              disabled={loading || !testEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Creating...' : '📧 Create Invitation'}
            </button>
            <button
              onClick={testCreateInvitationNoEmail}
              disabled={loading || !testEmail}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? '⏳ Creating...' : '📨 Create + Mark as Emailed'}
            </button>
            <button
              onClick={testCreateWithRandomEmailDBOnly}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳ Creating...' : '🎲 Create DB Only (No Email)'}
            </button>
            <button
              onClick={testEdgeFunctionConnectivity}
              disabled={loading}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '🔗 Test Edge Function'}
            </button>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800">📋 Current Invitations</h3>
          <button
            onClick={loadInvitations}
            disabled={loading}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        
        {invitations.length === 0 ? (
          <p className="text-gray-500 py-4">No invitations found.</p>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="border rounded-lg p-3 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                  <div>
                    <p className="font-medium">{invitation.email}</p>
                    <p className="text-sm text-gray-600">{invitation.role}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      invitation.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      invitation.status === 'expired' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invitation.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Created: {new Date(invitation.created_at).toLocaleDateString()}</p>
                    <p>Expires: {new Date(invitation.expires_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    {invitation.status === 'pending' && canManageInvitations && (
                      <button
                        onClick={() => testCancelInvitation(invitation.id)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationTester;
