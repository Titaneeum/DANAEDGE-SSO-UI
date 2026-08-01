'use client'

import CreateRoutePermissionDialog from './create-permission-dialog'
import type { RoutePermissionDialogData } from './create-permission-dialog'

interface UpdateRoutePermissionDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  data: RoutePermissionDialogData | null
}

const UpdateRoutePermissionDialog = ({ open, onClose, onSuccess, data }: UpdateRoutePermissionDialogProps) => {
  return (
    <CreateRoutePermissionDialog
      open={open}
      onClose={onClose}
      onSuccess={onSuccess}
      mode='update'
      data={data}
    />
  )
}

export default UpdateRoutePermissionDialog
