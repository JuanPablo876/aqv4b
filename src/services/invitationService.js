// Invitation Service for managing user invitations
import { supabase } from '../supabaseClient';
import { EmailService } from './EmailService';

export class InvitationService {
  // Create a new invitation
  static async createInvitation(email, role, invitedBy, message = '') {
    try {
      // Check for existing pending invitation
      const { data: existing, error: checkError } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', email)
        .eq('status', 'pending');
      if (checkError) console.warn('Error checking existing invitations:', checkError);
      if (existing?.length) throw new Error('Una invitación pendiente ya existe para este email');

      // Insert invitation
      const { data, error } = await supabase
        .from('invitations')
        .insert([{ email, role, invited_by: invitedBy, status: 'pending' }])
        .select('*')
        .single();
      if (error) throw error;

      // Send email
      try {
        const res = await EmailService.sendInvitationEmail(data.id);
        console.info(`📧 ${res.message}`);
      } catch (e) {
        console.warn('Error sending invitation email:', e);
      }

      // Update sent timestamp
      const { error: updErr } = await supabase
        .from('invitations')
        .update({ email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', data.id);
      if (updErr) console.warn('Failed to update email_sent_at:', updErr);
      return data;
    } catch (err) {
      console.error('Error creating invitation:', err);
      throw err;
    }
  }

  // Fetch invitations for list view
  static async getAllInvitations() {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching invitations:', err);
      throw err;
    }
  }

  // Validate invitation status and expiry
  static async validateInvitation(invitationId) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .single();
      if (error) throw new Error('Invitación no válida');
      if (new Date() > new Date(data.expires_at)) {
        await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitationId);
        throw new Error('La invitación ha expirado');
      }
      return data;
    } catch (err) {
      console.error('Error validating invitation:', err);
      throw err;
    }
  }

  // Accept invitation and sign up user
  static async acceptInvitation(invitationId, userData) {
    try {
      const invitation = await this.validateInvitation(invitationId);
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: invitation.email,
        password: userData.password,
        options: { data: { full_name: userData.fullName, role: invitation.role, invited_by: invitation.invited_by } }
      });
      if (authErr) throw authErr;
      await supabase
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString(), user_id: authData.user?.id })
        .eq('id', invitationId);
      return authData;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      throw err;
    }
  }

  // Fetch invitations with pagination for admin
  static async getInvitations(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`*, invited_by_user:invited_by(email, full_name), accepted_user:user_id(email, full_name)`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching invitations (admin):', err);
      throw err;
    }
  }

  // Resend invitation: extend expiry and re-email
  static async resendInvitation(invitationId) {
    try {
      const { data: invitation, error: fetchErr } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();
      if (fetchErr) throw fetchErr;
      if (invitation.status !== 'pending') throw new Error('Solo se pueden reenviar invitaciones pendientes');
      const newExp = new Date(); newExp.setDate(newExp.getDate() + 7);
      await supabase.from('invitations').update({ expires_at: newExp.toISOString(), updated_at: new Date().toISOString() }).eq('id', invitationId);
      const res = await EmailService.sendInvitationEmail(invitationId);
      console.info(`📧 ${res.message}`);
      await supabase.from('invitations').update({ email_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', invitationId);
      return true;
    } catch (err) {
      console.error('Error resending invitation:', err);
      throw err;
    }
  }

  // Cancel an invitation
  static async cancelInvitation(invitationId) {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invitationId);
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error cancelling invitation:', err);
      throw err;
    }
  }

  // Generate a secure token (unused)
  static generateInvitationToken() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
  }
}

export default InvitationService;
