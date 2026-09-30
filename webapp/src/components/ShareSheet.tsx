import { useState, type FormEvent } from 'react';
import { Mail, UserPlus, Users } from 'lucide-react';
import { Badge, Button, EmptyState, Field, Input, Sheet } from './ui';
import { toast } from '../store/useToastStore';

interface ShareSheetProps {
  open: boolean;
  onClose: () => void;
  tripTitle: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Trip sharing UI scaffold (behind the `sharing` feature flag).
 *
 * NOT WIRED: invitations are not sent or stored and no collaborator data is
 * read. Firestore rules and data models are intentionally unchanged; this
 * only previews the intended UX for multi-user trips.
 */
export default function ShareSheet({ open, onClose, tripTitle }: ShareSheetProps) {
  const [email, setEmail] = useState('');
  const valid = EMAIL_RE.test(email.trim());

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    toast('Sharing isn’t available yet', { description: 'Invites are a preview and were not sent.' });
    setEmail('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<><Users size={22} aria-hidden="true" /> Share “{tripTitle}”</>}
      headerActions={<Badge tone="orange" size="sm">Preview</Badge>}
    >
      <p className="mb-4 rounded-control border border-sys-orange/30 bg-sys-orange/10 p-3 text-footnote text-label">
        Trip sharing is coming soon. This screen is a preview — invitations are <strong>not</strong> sent and nothing is saved.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
        <Field label="Invite by email">
          {(id) => (
            <Input
              id={id}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={email.length > 0 && !valid}
            />
          )}
        </Field>
        <Button type="submit" disabled={!valid} className="self-start">
          <Mail size={18} aria-hidden="true" /> Send invite
        </Button>
      </form>
      <h3 className="mt-6 mb-2 text-caption font-bold tracking-wider text-label-tertiary uppercase">Collaborators</h3>
      <EmptyState
        className="py-6"
        icon={<UserPlus size={24} />}
        title="Only you so far"
        description="People you invite will appear here with their access level."
      />
    </Sheet>
  );
}
