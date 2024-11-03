interface Module {
    name: string;
    permission: string;
    child?: Array<{ name: string; permission: string }>;
  }

const crud = [
    {
        name: 'Create',
        permission: 'create'
    },
    {
        name: 'Edit',
        permission: 'edit'
    },
    {
        name: 'Delete',
        permission: 'delete'
    },
    {
        name: 'Show',
        permission: 'show'
    }
]

const modules: Module[] = [
    {
        name: 'User List',
        permission: 'user_list',
        child: crud
    },
    {
        name: 'Blog List',
        permission: 'blog_list',
        child: crud
    },
    {
        name: 'Categories',
        permission: 'categories',
        child: crud
    },
    {
        name: 'Tags',
        permission: 'tags',
        child: crud
    },
    {
        name: 'Gallery',
        permission: 'gallery',
    },
    {
        name: 'Story',
        permission: 'story', 
        child: crud
    },
    {
        name: 'HRM',
        permission: 'hrm',
    },
    {
        name: 'Settings',
        permission: 'setting',
    },
    {
        name: 'Contact',
        permission: 'contact',
    },
    {
        name: 'Newsletter',
        permission: 'newsletter',
    },
    {
        name: 'Language',
        permission: 'language',
    }
]


let permissions = modules?.map(m => {
    if (m.child) {
        return {
            ...m,
            child: m.child?.map(c => ({
                ...c,
                permission: `${m.permission}_${c.permission}`
            }))
        }
    }
    return m
})
export default permissions
