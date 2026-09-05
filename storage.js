// ============================================
// LOCAL STORAGE MANAGEMENT MODULE
// Pro To-Do List Application
// ============================================

const StorageManager = (() => {
    const STORAGE_KEYS = {
        TASKS: 'todoapp_tasks',
        CATEGORIES: 'todoapp_categories',
        SETTINGS: 'todoapp_settings',
        STATS: 'todoapp_stats'
    };

    // ============================================
    // INITIALIZATION
    // ============================================

    /**
     * Initialize storage with default data if empty
     */
    const init = () => {
        if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
            setTasks([]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
            setCategories([
                { id: 'general', name: 'General', color: '#6366f1', createdAt: Date.now() },
                { id: 'work', name: 'Work', color: '#3b82f6', createdAt: Date.now() },
                { id: 'personal', name: 'Personal', color: '#10b981', createdAt: Date.now() },
                { id: 'shopping', name: 'Shopping', color: '#f59e0b', createdAt: Date.now() }
            ]);
        }
        if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
            setSettings({
                darkMode: false,
                compactView: false,
                notifications: true,
                dueReminder: true,
                recurringReminder: true
            });
        }
        if (!localStorage.getItem(STORAGE_KEYS.STATS)) {
            setStats({
                totalTasksCreated: 0,
                totalTasksCompleted: 0,
                lastActivityDate: Date.now()
            });
        }
    };

    // ============================================
    // TASK MANAGEMENT
    // ============================================

    /**
     * Get all tasks
     * @returns {array} Array of tasks
     */
    const getTasks = () => {
        try {
            const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
            return tasks ? JSON.parse(tasks) : [];
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            return [];
        }
    };

    /**
     * Set all tasks
     * @param {array} tasks - Array of tasks
     */
    const setTasks = (tasks) => {
        try {
            localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks:', error);
            return false;
        }
    };

    /**
     * Add a new task
     * @param {object} task - Task object
     * @returns {string} Task ID
     */
    const addTask = (task) => {
        const tasks = getTasks();
        const newTask = {
            id: Date.now().toString(),
            ...task,
            createdAt: Date.now(),
            completedAt: null,
            updatedAt: Date.now()
        };
        tasks.push(newTask);
        setTasks(tasks);
        updateStats({ totalTasksCreated: 1 });
        return newTask.id;
    };

    /**
     * Update a task
     * @param {string} taskId - Task ID
     * @param {object} updates - Updates to apply
     * @returns {boolean} Success status
     */
    const updateTask = (taskId, updates) => {
        const tasks = getTasks();
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        
        if (taskIndex === -1) return false;
        
        tasks[taskIndex] = {
            ...tasks[taskIndex],
            ...updates,
            updatedAt: Date.now()
        };
        
        // Track completion for stats
        if (updates.completed && !tasks[taskIndex].completedAt) {
            tasks[taskIndex].completedAt = Date.now();
            updateStats({ totalTasksCompleted: 1 });
        }
        
        setTasks(tasks);
        return true;
    };

    /**
     * Delete a task
     * @param {string} taskId - Task ID
     * @returns {boolean} Success status
     */
    const deleteTask = (taskId) => {
        const tasks = getTasks();
        const filteredTasks = tasks.filter(t => t.id !== taskId);
        setTasks(filteredTasks);
        return tasks.length !== filteredTasks.length;
    };

    /**
     * Get a single task
     * @param {string} taskId - Task ID
     * @returns {object} Task object or null
     */
    const getTask = (taskId) => {
        const tasks = getTasks();
        return tasks.find(t => t.id === taskId) || null;
    };

    /**
     * Get tasks by filter
     * @param {object} filters - Filter criteria
     * @returns {array} Filtered tasks
     */
    const getTasksByFilter = (filters = {}) => {
        let tasks = getTasks();

        if (filters.completed !== undefined) {
            tasks = tasks.filter(t => t.completed === filters.completed);
        }

        if (filters.category) {
            tasks = tasks.filter(t => t.category === filters.category);
        }

        if (filters.priority) {
            tasks = tasks.filter(t => t.priority === filters.priority);
        }

        if (filters.recurring) {
            tasks = tasks.filter(t => t.recurring === filters.recurring);
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            tasks = tasks.filter(t =>
                t.title.toLowerCase().includes(searchLower) ||
                (t.description && t.description.toLowerCase().includes(searchLower))
            );
        }

        return tasks;
    };

    /**
     * Sort tasks
     * @param {array} tasks - Tasks to sort
     * @param {string} sortBy - Sort field
     * @param {string} order - 'asc' or 'desc'
     * @returns {array} Sorted tasks
     */
    const sortTasks = (tasks, sortBy = 'createdAt', order = 'desc') => {
        const sorted = [...tasks].sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];

            if (sortBy === 'priority') {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                aVal = priorityOrder[aVal] || 0;
                bVal = priorityOrder[bVal] || 0;
            }

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    };

    // ============================================
    // CATEGORY MANAGEMENT
    // ============================================

    /**
     * Get all categories
     * @returns {array} Array of categories
     */
    const getCategories = () => {
        try {
            const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
            return categories ? JSON.parse(categories) : [];
        } catch (error) {
            console.error('Error retrieving categories:', error);
            return [];
        }
    };

    /**
     * Set all categories
     * @param {array} categories - Array of categories
     */
    const setCategories = (categories) => {
        try {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
            return true;
        } catch (error) {
            console.error('Error saving categories:', error);
            return false;
        }
    };

    /**
     * Add a new category
     * @param {string} name - Category name
     * @param {string} color - Category color
     * @returns {string} Category ID
     */
    const addCategory = (name, color) => {
        const categories = getCategories();
        const newCategory = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            color,
            createdAt: Date.now()
        };
        categories.push(newCategory);
        setCategories(categories);
        return newCategory.id;
    };

    /**
     * Delete a category
     * @param {string} categoryId - Category ID
     * @returns {boolean} Success status
     */
    const deleteCategory = (categoryId) => {
        const categories = getCategories();
        const filteredCategories = categories.filter(c => c.id !== categoryId);
        setCategories(filteredCategories);

        // Move tasks from deleted category to general
        const tasks = getTasks();
        tasks.forEach(task => {
            if (task.category === categoryId) {
                task.category = 'general';
            }
        });
        setTasks(tasks);

        return categories.length !== filteredCategories.length;
    };

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {object} Category object or null
     */
    const getCategory = (categoryId) => {
        const categories = getCategories();
        return categories.find(c => c.id === categoryId) || null;
    };

    /**
     * Count tasks in category
     * @param {string} categoryId - Category ID
     * @returns {number} Task count
     */
    const getTaskCountInCategory = (categoryId) => {
        const tasks = getTasks();
        return tasks.filter(t => t.category === categoryId).length;
    };

    // ============================================
    // SETTINGS MANAGEMENT
    // ============================================

    /**
     * Get all settings
     * @returns {object} Settings object
     */
    const getSettings = () => {
        try {
            const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
            return settings ? JSON.parse(settings) : {};
        } catch (error) {
            console.error('Error retrieving settings:', error);
            return {};
        }
    };

    /**
     * Set settings
     * @param {object} settings - Settings object
     */
    const setSettings = (settings) => {
        try {
            localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    };

    /**
     * Update a single setting
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    const updateSetting = (key, value) => {
        const settings = getSettings();
        settings[key] = value;
        setSettings(settings);
    };

    /**
     * Get a single setting
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value
     * @returns {*} Setting value
     */
    const getSetting = (key, defaultValue = null) => {
        const settings = getSettings();
        return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
    };

    // ============================================
    // STATISTICS MANAGEMENT
    // ============================================

    /**
     * Get statistics
     * @returns {object} Statistics object
     */
    const getStats = () => {
        try {
            const stats = localStorage.getItem(STORAGE_KEYS.STATS);
            return stats ? JSON.parse(stats) : {};
        } catch (error) {
            console.error('Error retrieving stats:', error);
            return {};
        }
    };

    /**
     * Set statistics
     * @param {object} stats - Statistics object
     */
    const setStats = (stats) => {
        try {
            localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
            return true;
        } catch (error) {
            console.error('Error saving stats:', error);
            return false;
        }
    };

    /**
     * Update statistics
     * @param {object} updates - Updates to apply
     */
    const updateStats = (updates = {}) => {
        const stats = getStats();
        const updated = {
            ...stats,
            lastActivityDate: Date.now(),
            ...updates
        };
        setStats(updated);
    };

    /**
     * Calculate statistics from tasks
     * @returns {object} Calculated statistics
     */
    const calculateStats = () => {
        const tasks = getTasks();
        const now = Date.now();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            active: tasks.filter(t => !t.completed).length,
            overdue: 0,
            completedToday: 0,
            completedThisWeek: 0,
            completedThisMonth: 0,
            highPriority: 0,
            mediumPriority: 0,
            lowPriority: 0
        };

        tasks.forEach(task => {
            // Count overdue
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                if (dueDate < today) {
                    stats.overdue++;
                }
            }

            // Count completed today
            if (task.completed && task.completedAt) {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0);
                if (completedDate.getTime() === today.getTime()) {
                    stats.completedToday++;
                }
            }

            // Count completed this week
            if (task.completed && task.completedAt) {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                if (task.completedAt > weekAgo.getTime()) {
                    stats.completedThisWeek++;
                }
            }

            // Count completed this month
            if (task.completed && task.completedAt) {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                if (task.completedAt > monthAgo.getTime()) {
                    stats.completedThisMonth++;
                }
            }

            // Count by priority
            if (!task.completed) {
                if (task.priority === 'high') stats.highPriority++;
                if (task.priority === 'medium') stats.mediumPriority++;
                if (task.priority === 'low') stats.lowPriority++;
            }
        });

        return stats;
    };

    // ============================================
    // DATA IMPORT/EXPORT
    // ============================================

    /**
     * Export all data
     * @returns {object} All data
     */
    const exportData = () => {
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            tasks: getTasks(),
            categories: getCategories(),
            settings: getSettings(),
            stats: getStats()
        };
    };

    /**
     * Import data
     * @param {object} data - Data to import
     * @returns {boolean} Success status
     */
    const importData = (data) => {
        try {
            if (data.tasks) setTasks(data.tasks);
            if (data.categories) setCategories(data.categories);
            if (data.settings) setSettings(data.settings);
            if (data.stats) setStats(data.stats);
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    };

    /**
     * Get storage size used
     * @returns {number} Size in bytes
     */
    const getStorageSize = () => {
        let size = 0;
        for (let key in STORAGE_KEYS) {
            const item = localStorage.getItem(STORAGE_KEYS[key]);
            if (item) {
                size += item.length + key.length;
            }
        }
        return size;
    };

    /**
     * Clear all data
     * @param {boolean} confirm - Confirmation flag
     * @returns {boolean} Success status
     */
    const clearAllData = (confirm = false) => {
        if (!confirm) return false;

        try {
            Object.values(STORAGE_KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            init(); // Reinitialize with defaults
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    };

    // ============================================
    // RECURRING TASKS
    // ============================================

    /**
     * Process recurring tasks
     */
    const processRecurringTasks = () => {
        const tasks = getTasks();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            if (task.completed && task.recurring && task.recurring !== 'none') {
                const completedDate = new Date(task.completedAt);
                completedDate.setHours(0, 0, 0, 0);

                let shouldRecreate = false;
                const nextDate = new Date(completedDate);

                switch (task.recurring) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        shouldRecreate = today >= nextDate;
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        shouldRecreate = today >= nextDate;
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        shouldRecreate = today >= nextDate;
                        break;
                }

                if (shouldRecreate) {
                    const newTask = {
                        ...task,
                        id: Date.now().toString(),
                        completed: false,
                        completedAt: null,
                        createdAt: Date.now(),
                        dueDate: nextDate.toISOString().split('T')[0]
                    };
                    tasks.push(newTask);
                    task.nextRecurrence = nextDate;
                }
            }
        });

        setTasks(tasks);
    };

    // ============================================
    // PUBLIC API
    // ============================================

    return {
        init,
        // Tasks
        getTasks,
        setTasks,
        addTask,
        updateTask,
        deleteTask,
        getTask,
        getTasksByFilter,
        sortTasks,
        // Categories
        getCategories,
        setCategories,
        addCategory,
        deleteCategory,
        getCategory,
        getTaskCountInCategory,
        // Settings
        getSettings,
        setSettings,
        updateSetting,
        getSetting,
        // Statistics
        getStats,
        setStats,
        updateStats,
        calculateStats,
        // Import/Export
        exportData,
        importData,
        getStorageSize,
        clearAllData,
        // Recurring
        processRecurringTasks
    };
})();

// Initialize storage on load
document.addEventListener('DOMContentLoaded', () => {
    StorageManager.init();
});
