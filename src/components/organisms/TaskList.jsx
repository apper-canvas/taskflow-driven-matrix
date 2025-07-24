import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import TaskCard from "@/components/molecules/TaskCard"
import QuickAddBar from "@/components/molecules/QuickAddBar"
import SearchBar from "@/components/molecules/SearchBar"
import DeleteConfirmModal from "@/components/molecules/DeleteConfirmModal"
import TaskEditModal from "@/components/molecules/TaskEditModal"
import Loading from "@/components/ui/Loading"
import Error from "@/components/ui/Error"
import Empty from "@/components/ui/Empty"
import ApperIcon from "@/components/ApperIcon"
import Button from "@/components/atoms/Button"
import { taskService } from "@/services/api/taskService"
import { categoryService } from "@/services/api/categoryService"
const TaskList = () => {
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedTasks, setSelectedTasks] = useState([])
  const [showCompleted, setShowCompleted] = useState(false)
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null, type: 'single' })
  const [editModal, setEditModal] = useState({ isOpen: false, task: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const { categoryName } = useParams()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") || ""

  const loadData = async () => {
    try {
      setLoading(true)
      setError("")
      
      let tasksData
      if (searchQuery) {
        tasksData = await taskService.search(searchQuery)
      } else if (categoryName) {
        tasksData = await taskService.getByCategory(categoryName)
      } else {
        tasksData = await taskService.getAll()
      }
      
      const categoriesData = await categoryService.getAll()
      
      setTasks(tasksData)
      setCategories(categoriesData)
    } catch (err) {
      setError("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [categoryName, searchQuery])

  const handleAddTask = async (taskData) => {
try {
      const result = await taskService.create(taskData)
      if (result.tasks) {
        // Multiple tasks created from recurring pattern
        setTasks(prev => [...result.tasks, ...prev])
        toast.success(`${result.tasks.length} recurring tasks created!`)
      } else {
        // Single task created
        setTasks(prev => [result, ...prev])
        toast.success("Task added successfully!")
      }
    } catch (err) {
      toast.error("Failed to add task")
      throw err
    }
  }

  const handleToggleComplete = async (taskId) => {
    const task = tasks.find(t => t.Id === taskId)
    if (!task) return

    try {
      const updatedTask = await taskService.update(taskId, {
        completed: !task.completed
      })
      
      setTasks(prev => 
        prev.map(t => t.Id === taskId ? updatedTask : t)
      )
      
      toast.success(
        updatedTask.completed ? "Task completed! 🎉" : "Task marked as incomplete"
      )
    } catch (err) {
      toast.error("Failed to update task")
    }
  }

const handleEditTask = (taskId) => {
    const task = tasks.find(t => t.Id === taskId)
    if (task) {
      setEditModal({ isOpen: true, task })
    }
  }

  const handleSaveTask = async (formData) => {
    if (!editModal.task) return

    setIsSaving(true)
    try {
      const updatedTask = await taskService.update(editModal.task.Id, formData)
      setTasks(prev => prev.map(t => t.Id === editModal.task.Id ? updatedTask : t))
      setEditModal({ isOpen: false, task: null })
      toast.success("Task updated successfully")
    } catch (err) {
      toast.error("Failed to update task")
    } finally {
      setIsSaving(false)
    }
  }
const handleDeleteTask = (taskId) => {
    setDeleteModal({ 
      isOpen: true, 
      taskId, 
      type: 'single' 
    })
  }

  const confirmDelete = async () => {
    if (!deleteModal.taskId) return

    setIsDeleting(true)
    try {
      await taskService.delete(deleteModal.taskId)
      setTasks(prev => prev.filter(t => t.Id !== deleteModal.taskId))
      setDeleteModal({ isOpen: false, taskId: null, type: 'single' })
      toast.success("Task deleted successfully")
    } catch (err) {
      toast.error("Failed to delete task")
    } finally {
      setIsDeleting(false)
    }
  }
const handleBulkDelete = () => {
    if (selectedTasks.length === 0) return
    
    setDeleteModal({ 
      isOpen: true, 
      taskId: null, 
      type: 'bulk' 
    })
  }

  const confirmBulkDelete = async () => {
    setIsDeleting(true)
    try {
      await taskService.bulkDelete(selectedTasks)
      setTasks(prev => prev.filter(t => !selectedTasks.includes(t.Id)))
      setSelectedTasks([])
      setDeleteModal({ isOpen: false, taskId: null, type: 'single' })
      toast.success(`${selectedTasks.length} tasks deleted`)
    } catch (err) {
      toast.error("Failed to delete tasks")
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredTasks = tasks.filter(task => 
    showCompleted ? task.completed : !task.completed
  )

  const completedTasks = tasks.filter(task => task.completed)
  const activeTasks = tasks.filter(task => !task.completed)

  const getPageTitle = () => {
    if (searchQuery) return `Search results for "${searchQuery}"`
    if (categoryName) return categoryName.charAt(0).toUpperCase() + categoryName.slice(1)
    return "All Tasks"
  }

  const getEmptyType = () => {
    if (searchQuery) return "search"
    if (categoryName) return "category"
    return "tasks"
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="h-8 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
            <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse" />
          </div>
          <Loading type="tasks" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Error 
            type="tasks" 
            message={error}
            onRetry={loadData}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
              </h1>
              <p className="text-gray-600 mt-1">
                {activeTasks.length} active, {completedTasks.length} completed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SearchBar onSearch={() => {}} />
              {selectedTasks.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="inline-flex items-center gap-2"
                >
                  <ApperIcon name="Trash2" size={14} />
                  Delete ({selectedTasks.length})
                </Button>
              )}
            </div>
          </div>

          {/* Quick Add */}
          {!searchQuery && (
            <QuickAddBar 
              onAdd={handleAddTask}
              categories={categories}
            />
          )}
        </div>

        {/* Task Controls */}
        {(activeTasks.length > 0 || completedTasks.length > 0) && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCompleted(false)}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                  !showCompleted 
                    ? "bg-primary text-white" 
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Active ({activeTasks.length})
              </button>
              <button
                onClick={() => setShowCompleted(true)}
                className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                  showCompleted 
                    ? "bg-primary text-white" 
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Completed ({completedTasks.length})
              </button>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <Empty
                type={getEmptyType()}
                searchQuery={searchQuery}
                onAction={() => {
                  if (searchQuery) {
                    window.location.href = "/"
                  }
                }}
                actionLabel={searchQuery ? "Clear Search" : "Add First Task"}
              />
            ) : (
              filteredTasks.map((task) => (
                <motion.div
                  key={task.Id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskCard
                    task={task}
                    onToggleComplete={() => handleToggleComplete(task.Id)}
                    onEdit={() => handleEditTask(task.Id)}
                    onDelete={() => handleDeleteTask(task.Id)}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
</div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, type: 'single' })}
        onConfirm={deleteModal.type === 'bulk' ? confirmBulkDelete : confirmDelete}
        title={deleteModal.type === 'bulk' ? "Delete Tasks" : "Delete Task"}
        message={
          deleteModal.type === 'bulk' 
            ? `Are you sure you want to delete ${selectedTasks.length} selected tasks?`
            : "Are you sure you want to delete this task?"
        }
        confirmText={deleteModal.type === 'bulk' ? `Delete ${selectedTasks.length} Tasks` : "Delete Task"}
        isLoading={isDeleting}
        variant={deleteModal.type}
      />

      {/* Task Edit Modal */}
      <TaskEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, task: null })}
        onSave={handleSaveTask}
        task={editModal.task}
        isLoading={isSaving}
      />
    </div>
  )
}

export default TaskList