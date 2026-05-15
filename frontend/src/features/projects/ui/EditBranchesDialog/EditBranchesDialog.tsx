import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import i18n from '@/shared/lib/i18n'
import { Button } from '@/shared/ui/Button/Button'
import { Field } from '@/shared/ui/Field/Field'
import { FormDialog } from '@/shared/ui/FormDialog/FormDialog'
import { Input } from '@/shared/ui/Input/Input'

interface EditBranchesDialogProps {
  open: boolean
  sourceBranch: string
  targetBranch: string
  loading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { source_branch: string; target_branch: string }) => void
}

export function EditBranchesDialog({
  open,
  sourceBranch,
  targetBranch,
  loading = false,
  onOpenChange,
  onSubmit,
}: EditBranchesDialogProps) {
  if (!open) {
    return null
  }

  return (
    <OpenEditBranchesDialog
      sourceBranch={sourceBranch}
      targetBranch={targetBranch}
      loading={loading}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
    />
  )
}

interface OpenEditBranchesDialogProps {
  sourceBranch: string
  targetBranch: string
  loading: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (payload: { source_branch: string; target_branch: string }) => void
}

function createSchema() {
  const branchSchema = z.string().trim().min(1, i18n.t('repositories:validation.branch_required'))
  return z.object({
    source_branch: branchSchema,
    target_branch: branchSchema,
  })
}

type FormValues = { source_branch: string; target_branch: string }

function OpenEditBranchesDialog({
  sourceBranch,
  targetBranch,
  loading,
  onOpenChange,
  onSubmit,
}: OpenEditBranchesDialogProps) {
  const { t } = useTranslation(['repositories', 'common'])
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema()),
    defaultValues: { source_branch: sourceBranch, target_branch: targetBranch },
  })

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={t('edit_branches')}
      actions={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button
            loading={loading}
            onClick={() =>
              void handleSubmit(({ source_branch, target_branch }) =>
                onSubmit({ source_branch, target_branch }),
              )()
            }
          >
            {t('save_branches')}
          </Button>
        </>
      }
    >
      <Field
        label={t('source_branch_label')}
        htmlFor="edit-source-branch"
        error={errors.source_branch?.message}
        required
      >
        <Input
          id="edit-source-branch"
          inputClassName="mono"
          error={Boolean(errors.source_branch)}
          {...register('source_branch')}
        />
      </Field>

      <Field
        label={t('target_branch_label')}
        htmlFor="edit-target-branch"
        error={errors.target_branch?.message}
        required
      >
        <Input
          id="edit-target-branch"
          inputClassName="mono"
          error={Boolean(errors.target_branch)}
          {...register('target_branch')}
        />
      </Field>
    </FormDialog>
  )
}
