import {Router} from "express";
import {authCheck} from "../../middlewares/auth";
import {
    postDepartment, departmentList, getDepartmentElements, getDepartment, delDepartment,
    getDepartmentWiseSubDepartmentList
} from "../../controllers/department.controller";

const departmentRoutes = Router()
departmentRoutes.get('/list', departmentList)
departmentRoutes.get('/elements', getDepartmentElements)
departmentRoutes.get('/sub-department-list', getDepartmentWiseSubDepartmentList)
departmentRoutes.get('/', getDepartment)
departmentRoutes.post('/', authCheck({isAdmin: true, isEmployee: true}), postDepartment)
departmentRoutes.delete('/', authCheck({isAdmin: true, isEmployee: true}), delDepartment)

export default departmentRoutes