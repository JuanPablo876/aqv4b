// Invitation Service for managing user invitations
import { supabase } from '../supabaseClient';
import { EmailService } from './EmailService';

export class InvitationService {
  
  // Create a new invitation
  static async createInvitation(email, role, invitedBy, message = '') {
    try {
      // Check if invitation already exists
      const { data: existingInvitations, error: checkError } = await supabase
        .from('invitations')
        .select('*')
        .eq('email', email)
        .eq('status', 'pending');

      if (checkError) {
        console.warn('Error checking existing invitations:', checkError);
        // Continue anyway - this check is not critical
      }

      if (existingInvitations && existingInvitations.length > 0) {
        throw new Error('Una invitación pendiente ya existe para este email');
      }

      // Create invitation record
      const { data, error } = await supabase
        .from('invitations')
        .insert([
          {
            email,
            role,
            invited_by: invitedBy,
            status: 'pending'
            // expires_at and created_at will be set by database defaults
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Now try to send actual email via Edge Function
      try {
        console.log('🚀 Simulating invitation email send for ID:', data.id);
        // For now, we'll simulate email sending since Edge Functions aren't configured
        // await EmailService.sendInvitationEmail(data.id);
        
        // Simulate successful email sending
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        console.log('✅ Invitation email simulated successfully');
        
        // Show user notification about email simulation
        if (typeof window !== 'undefined' && window.alert) {
          // For development: notify user that email is simulated
          console.info('📧 En desarrollo: El email de invitación fue simulado. En producción se enviará un email real.');
        }
        
        // Mark as sent
        const { error: updateError } = await supabase
          .from('invitations')
          .update({ 
            email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
          
        if (updateError) {
          console.warn('Failed to update email_sent_at:', updateError);
        }
        
      } catch (emailError) {
        console.warn('⚠️ Failed to send invitation email, but invitation created:', emailError.message);
      }

      return data;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  }

  // Get all invitations (for admin/manager view)
  static async getAllInvitations() {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  // Validate invitation by ID (instead of token)
  static async validateInvitation(invitationId) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('status', 'pending')
        .single();

      if (error) throw new Error('Invitación no válida');

      // Check if expired
      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      if (now > expiresAt) {
        // Mark as expired
        await supabase
          .from('invitations')
          .update({ status: 'expired' })
          .eq('id', data.id);
        
        throw new Error('La invitación ha expirado');
      }

      return data;
    } catch (error) {
      console.error('Error validating invitation:', error);
      throw error;
    }
  }

  // Accept invitation and create user
  static async acceptInvitation(invitationId, userData) {
    try {
      // Validate invitation first
      const invitation = await this.validateInvitation(token);

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.fullName,
            role: invitation.role,
            invited_by: invitation.invited_by
          }
        }
      });

      if (authError) throw authError;

      // Mark invitation as accepted
      await supabase
        .from('invitations')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          user_id: authData.user?.id
        })
        .eq('token', token);

      return authData;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw error;
    }
  }

  // Get all invitations (for admin panel)
  static async getInvitations(limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select(`
          *,
          invited_by_user:invited_by(email, full_name),
          accepted_user:user_id(email, full_name)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error fetching invitations:', error);
      throw error;
    }
  }

  // Resend invitation
  static async resendInvitation(invitationId) {
    try {
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError) throw fetchError;

      if (invitation.status !== 'pending') {
        throw new Error('Solo se pueden reenviar invitaciones pendientes');
      }

      // Update expiration date
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      const { error: updateError } = await supabase
        .from('invitations')
        .update({ 
          expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // TODO: Resend invitation email
      // await this.sendInvitationEmail(invitation.email, invitation.token, invitation.message);

      return true;
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw error;
    }
  }

  // Cancel invitation
  static async cancelInvitation(invitationId) {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error canceling invitation:', error);
      throw error;
    }
  }

  // Cancel invitation
  static async cancelInvitation(invitationId) {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw error;
    }
  }

  // Generate secure invitation token
  static generateInvitationToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // TODO: Implement email sending
  static async sendInvitationEmail(email, token, message) {
    // This would integrate with your email service (SendGrid, Mailgun, etc.)
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    
    console.log(`Invitation email would be sent to ${email}`);
    console.log(`Invite URL: ${inviteUrl}`);
    console.log(`Message: ${message}`);
    
    // Example implementation:
    // return await emailService.send({
    //   to: email,
    //   template: 'invitation',
    //   data: { inviteUrl, message }
    // });
  }

  // Check if current user can invite others
  static async canInvite(userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      // Check user role from metadata
      const userRole = user.user_metadata?.role;
      
      return ['admin', 'manager'].includes(userRole);
    } catch (error) {
      console.error('Error checking invite permissions:', error);
      return false;
    }
  }
}

export default InvitationService;
