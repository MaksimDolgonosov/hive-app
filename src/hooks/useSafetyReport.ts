import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import * as safetyApi from '@/src/api/safety';
import type { SafetyReportReason, SafetyReportTarget } from '@/src/types';
import { getApiErrorCode } from '@/src/utils/api-error';
import { trackEvent } from '@/src/utils/analytics-queue';
import {
  forgetBlockedUser,
  invalidateSafetySurfaces,
  rememberBlockedUser,
} from '@/src/utils/blocked-users-cache';
import { normalizeSafetyComment } from '@/src/utils/safety-report';
import { showMessageToast } from '@/src/utils/show-toast';

type ReportAuthor = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

type SubmitReportInput = {
  target: SafetyReportTarget;
  targetId: string;
  reason: SafetyReportReason;
  comment: string;
  alsoHide: boolean;
  author: ReportAuthor;
};

function reportFailureKey(error: unknown): string {
  const code = getApiErrorCode(error);

  if (code === 'EMAIL_SEND_FAILED') {
    return 'safety.reportMailFailed';
  }

  if (code === 'RATE_LIMITED') {
    return 'safety.rateLimited';
  }

  if (code === 'USER_NOT_FOUND') {
    return 'errors.USER_NOT_FOUND';
  }

  if (code === 'STING_NOT_FOUND') {
    return 'errors.STING_NOT_FOUND';
  }

  return 'safety.failed';
}

export function useSafetyReport() {
  const queryClient = useQueryClient();
  const [reporting, setReporting] = useState(false);
  const [hiding, setHiding] = useState(false);

  async function hideAuthor(author: ReportAuthor, silent = false): Promise<boolean> {
    try {
      await safetyApi.blockUser(author.id);
      rememberBlockedUser(author, queryClient);
      invalidateSafetySurfaces(queryClient, author.id);
      trackEvent('user_blocked');
      return true;
    } catch (error) {
      if (!silent) {
        showMessageToast(
          getApiErrorCode(error) === 'USER_NOT_FOUND' ? 'errors.USER_NOT_FOUND' : 'safety.failed',
        );
      }

      return false;
    }
  }

  async function submitReport(input: SubmitReportInput): Promise<boolean> {
    if (reporting) {
      return false;
    }

    setReporting(true);
    const comment = normalizeSafetyComment(input.comment);

    try {
      if (input.target === 'user') {
        await safetyApi.reportUser(input.targetId, input.reason, comment);
      } else {
        await safetyApi.reportSting(input.targetId, input.target, input.reason, comment);
      }

      trackEvent('safety_report_submitted', {
        props: {
          target: input.target,
          reason: input.reason,
          alsoBlock: input.alsoHide,
        },
      });

      if (!input.alsoHide) {
        showMessageToast('safety.reportSent');
        return true;
      }

      const hidden = await hideAuthor(input.author, true);
      showMessageToast(hidden ? 'safety.reportSent' : 'safety.reportSentHideFailed');
      return true;
    } catch (error) {
      showMessageToast(reportFailureKey(error));
      return false;
    } finally {
      setReporting(false);
    }
  }

  async function hideUser(author: ReportAuthor): Promise<boolean> {
    if (hiding) {
      return false;
    }

    setHiding(true);

    try {
      const hidden = await hideAuthor(author);
      if (hidden) {
        showMessageToast('safety.hidden');
      }
      return hidden;
    } finally {
      setHiding(false);
    }
  }

  async function unhideUser(userId: string): Promise<boolean> {
    if (hiding) {
      return false;
    }

    setHiding(true);

    try {
      await safetyApi.unblockUser(userId);
      forgetBlockedUser(userId, queryClient);
      invalidateSafetySurfaces(queryClient, userId);
      trackEvent('user_unblocked');
      showMessageToast('safety.unhidden');
      return true;
    } catch {
      showMessageToast('safety.failed');
      return false;
    } finally {
      setHiding(false);
    }
  }

  return { reporting, hiding, submitReport, hideUser, unhideUser };
}
