import { Router } from 'express';
const roleRoutes = Router();

import {authCheck} from '../../middlewares/auth';
import {
    postRole, getRoles, getRole, deleteRole, getPermissions, postPermissions,
    departmentWiseList
} from '../../controllers/role.controller'


roleRoutes.post('/', postRole)
roleRoutes.get('/list', getRoles)
roleRoutes.get('/department-wise-list', authCheck({isAdmin: true, isEmployee: true}), departmentWiseList)
roleRoutes.get('/', getRole)
roleRoutes.delete('/', authCheck({isAdmin: true, isEmployee: true}), deleteRole)

roleRoutes.post('/permissions',authCheck({isAdmin: true, isEmployee: true}), postPermissions)
roleRoutes.get('/permissions',  getPermissions)

export default roleRoutes;