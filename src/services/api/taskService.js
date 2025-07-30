// Initialize ApperClient for database operations
const { ApperClient } = window.ApperSDK;

export const taskService = {
  getApperClient() {
    return new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
  },

  async getAll() {
    try {
      const apperClient = this.getApperClient();
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Name" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } },
          { field: { Name: "title_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "category_c" } },
          { field: { Name: "dueDate_c" } },
          { field: { Name: "createdAt_c" } },
          { field: { Name: "order_c" } },
          { field: { Name: "isRecurring_c" } },
          { field: { Name: "recurringData_c" } },
          { field: { Name: "recurringParent_c" } }
        ],
        orderBy: [
          { fieldName: "order_c", sorttype: "ASC" }
        ]
      };
      
      const response = await apperClient.fetchRecords("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }
      
      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

  async getById(id) {
    try {
      const apperClient = this.getApperClient();
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Name" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } },
          { field: { Name: "title_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "category_c" } },
          { field: { Name: "dueDate_c" } },
          { field: { Name: "createdAt_c" } },
          { field: { Name: "order_c" } },
          { field: { Name: "isRecurring_c" } },
          { field: { Name: "recurringData_c" } },
          { field: { Name: "recurringParent_c" } }
        ]
      };
      
      const response = await apperClient.getRecordById("task_c", parseInt(id), params);
      
      if (!response || !response.data) {
        return null;
      }
      
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error(`Error fetching task with ID ${id}:`, error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return null;
    }
  },

  async create(taskData) {
    try {
      if (taskData.isRecurring && taskData.recurringData) {
        return this.createRecurringTasks(taskData);
      }
      
      const apperClient = this.getApperClient();
      
      // Get max order for new task
      const allTasks = await this.getAll();
      const maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order_c || 0)) : 0;
      
      const params = {
        records: [
          {
            title_c: taskData.title,
            completed_c: false,
            priority_c: taskData.priority || "medium",
            category_c: taskData.category || "Personal",
            dueDate_c: taskData.dueDate || null,
            createdAt_c: new Date().toISOString(),
            order_c: maxOrder + 1,
            isRecurring_c: taskData.isRecurring || false,
            recurringData_c: JSON.stringify(taskData.recurringData) || null,
            recurringParent_c: null
          }
        ]
      };
      
      const response = await apperClient.createRecord("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        const failedRecords = response.results.filter(result => !result.success);
        
        if (failedRecords.length > 0) {
          console.error(`Failed to create tasks ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        }
        
        return successfulRecords.length > 0 ? successfulRecords[0].data : null;
      }
      
      return null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error creating task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

  async createRecurringTasks(taskData) {
    const { recurringData } = taskData;
    const createdTasks = [];
    const startDate = new Date(recurringData.startDate);
    const endDate = recurringData.endDate ? new Date(recurringData.endDate) : null;
    const currentDate = new Date(startDate);
    
    let taskCount = 0;
    const maxTasks = endDate ? 365 : 30;
    
    const allTasks = await this.getAll();
    let maxOrder = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.order_c || 0)) : 0;
    
    const tasksToCreate = [];
    
    while (taskCount < maxTasks && (!endDate || currentDate <= endDate)) {
      const shouldCreateTask = this.shouldCreateTaskOnDate(currentDate, recurringData, taskCount);
      
      if (shouldCreateTask) {
        const newTask = {
          title_c: taskData.title,
          completed_c: false,
          priority_c: taskData.priority || "medium",
          category_c: taskData.category || "Personal",
          dueDate_c: currentDate.toISOString().split('T')[0],
          createdAt_c: new Date().toISOString(),
          order_c: maxOrder + tasksToCreate.length + 1,
          isRecurring_c: true,
          recurringData_c: JSON.stringify(recurringData),
          recurringParent_c: null
        };
        tasksToCreate.push(newTask);
        taskCount++;
      }
      
      this.advanceDate(currentDate, recurringData);
      
      if (taskCount === 0 && tasksToCreate.length === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    if (tasksToCreate.length > 0) {
      const apperClient = this.getApperClient();
      const params = {
        records: tasksToCreate
      };
      
      const response = await apperClient.createRecord("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successfulRecords = response.results.filter(result => result.success);
        return { tasks: successfulRecords.map(result => result.data) };
      }
    }
    
    return { tasks: [] };
  },

  shouldCreateTaskOnDate(date, recurringData, iteration) {
    const { pattern, selectedDays, frequency } = recurringData;
    
    switch (pattern) {
      case "daily":
        return iteration % frequency === 0;
      case "weekly":
        if (selectedDays.length === 0) return false;
        const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
        const dayName = dayNames[date.getDay()];
        return selectedDays.includes(dayName) && Math.floor(iteration / 7) % frequency === 0;
      case "monthly":
        return date.getDate() === new Date(recurringData.startDate).getDate() && iteration % frequency === 0;
      case "custom":
        return iteration % recurringData.customInterval === 0;
      default:
        return false;
    }
  },

  advanceDate(date, recurringData) {
    const { pattern, customInterval, customUnit } = recurringData;
    
    switch (pattern) {
      case "daily":
        date.setDate(date.getDate() + 1);
        break;
      case "weekly":
        date.setDate(date.getDate() + 1);
        break;
      case "monthly":
        date.setMonth(date.getMonth() + 1);
        break;
      case "custom":
        switch (customUnit) {
          case "days":
            date.setDate(date.getDate() + 1);
            break;
          case "weeks":
            date.setDate(date.getDate() + 7);
            break;
          case "months":
            date.setMonth(date.getMonth() + 1);
            break;
          case "years":
            date.setFullYear(date.getFullYear() + 1);
            break;
        }
        break;
    }
  },

  async update(id, updates) {
    try {
      const apperClient = this.getApperClient();
      
      // Only include updateable fields
      const updateData = {};
      if (updates.title !== undefined) updateData.title_c = updates.title;
      if (updates.completed !== undefined) updateData.completed_c = updates.completed;
      if (updates.priority !== undefined) updateData.priority_c = updates.priority;
      if (updates.category !== undefined) updateData.category_c = updates.category;
      if (updates.dueDate !== undefined) updateData.dueDate_c = updates.dueDate;
      if (updates.order !== undefined) updateData.order_c = updates.order;
      if (updates.isRecurring !== undefined) updateData.isRecurring_c = updates.isRecurring;
      if (updates.recurringData !== undefined) updateData.recurringData_c = JSON.stringify(updates.recurringData);
      if (updates.recurringParent !== undefined) updateData.recurringParent_c = updates.recurringParent;
      
      const params = {
        records: [
          {
            Id: parseInt(id),
            ...updateData
          }
        ]
      };
      
      const response = await apperClient.updateRecord("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successfulUpdates = response.results.filter(result => result.success);
        const failedUpdates = response.results.filter(result => !result.success);
        
        if (failedUpdates.length > 0) {
          console.error(`Failed to update tasks ${failedUpdates.length} records:${JSON.stringify(failedUpdates)}`);
        }
        
        return successfulUpdates.length > 0 ? successfulUpdates[0].data : null;
      }
      
      return null;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error updating task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

  async delete(id) {
    try {
      const apperClient = this.getApperClient();
      
      const params = {
        RecordIds: [parseInt(id)]
      };
      
      const response = await apperClient.deleteRecord("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete tasks ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        }
        
        return successfulDeletions.length > 0;
      }
      
      return false;
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error deleting task:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

  async bulkDelete(ids) {
    try {
      const apperClient = this.getApperClient();
      
      const params = {
        RecordIds: ids.map(id => parseInt(id))
      };
      
      const response = await apperClient.deleteRecord("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }
      
      if (response.results) {
        const successfulDeletions = response.results.filter(result => result.success);
        const failedDeletions = response.results.filter(result => !result.success);
        
        if (failedDeletions.length > 0) {
          console.error(`Failed to delete tasks ${failedDeletions.length} records:${JSON.stringify(failedDeletions)}`);
        }
        
        return successfulDeletions.map(result => result.data);
      }
      
      return [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error bulk deleting tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      throw error;
    }
  },

  async reorder(taskId, newOrder) {
    try {
      const result = await this.update(taskId, { order: newOrder });
      return !!result;
    } catch (error) {
      return false;
    }
  },

  async getByCategory(categoryName) {
    try {
      const apperClient = this.getApperClient();
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Name" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } },
          { field: { Name: "title_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "category_c" } },
          { field: { Name: "dueDate_c" } },
          { field: { Name: "createdAt_c" } },
          { field: { Name: "order_c" } },
          { field: { Name: "isRecurring_c" } },
          { field: { Name: "recurringData_c" } },
          { field: { Name: "recurringParent_c" } }
        ],
        where: [
          {
            FieldName: "category_c",
            Operator: "EqualTo",
            Values: [categoryName]
          }
        ],
        orderBy: [
          { fieldName: "order_c", sorttype: "ASC" }
        ]
      };
      
      const response = await apperClient.fetchRecords("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }
      
      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error fetching tasks by category:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  },

  async search(query) {
    try {
      const searchTerm = query.toLowerCase().trim();
      if (!searchTerm) return this.getAll();
      
      const apperClient = this.getApperClient();
      const params = {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Tags" } },
          { field: { Name: "Name" } },
          { field: { Name: "Owner" } },
          { field: { Name: "CreatedOn" } },
          { field: { Name: "CreatedBy" } },
          { field: { Name: "ModifiedOn" } },
          { field: { Name: "ModifiedBy" } },
          { field: { Name: "title_c" } },
          { field: { Name: "completed_c" } },
          { field: { Name: "priority_c" } },
          { field: { Name: "category_c" } },
          { field: { Name: "dueDate_c" } },
          { field: { Name: "createdAt_c" } },
          { field: { Name: "order_c" } },
          { field: { Name: "isRecurring_c" } },
          { field: { Name: "recurringData_c" } },
          { field: { Name: "recurringParent_c" } }
        ],
        whereGroups: [
          {
            operator: "OR",
            subGroups: [
              {
                conditions: [
                  {
                    fieldName: "title_c",
                    operator: "Contains",
                    values: [searchTerm]
                  }
                ],
                operator: "OR"
              },
              {
                conditions: [
                  {
                    fieldName: "category_c",
                    operator: "Contains",
                    values: [searchTerm]
                  }
                ],
                operator: "OR"
              }
            ]
          }
        ],
        orderBy: [
          { fieldName: "order_c", sorttype: "ASC" }
        ]
      };
      
      const response = await apperClient.fetchRecords("task_c", params);
      
      if (!response.success) {
        console.error(response.message);
        return [];
      }
      
      return response.data || [];
    } catch (error) {
      if (error?.response?.data?.message) {
        console.error("Error searching tasks:", error?.response?.data?.message);
      } else {
        console.error(error.message);
      }
      return [];
    }
  }
};