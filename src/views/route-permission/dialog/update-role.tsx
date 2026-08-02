'use client'

import CreateRoleDialog from './create-role'
import type { RoleDialogData } from './create-role'

interface UpdateRoleDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  data: RoleDialogData | null
}

const UpdateRoleDialog = ({ open, onClose, onSuccess, data }: UpdateRoleDialogProps) => {
  return <CreateRoleDialog open={open} onClose={onClose} onSuccess={onSuccess} mode='update' data={data} />
}

export default UpdateRoleDialog
