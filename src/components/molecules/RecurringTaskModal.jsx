import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ApperIcon from "@/components/ApperIcon"
import Input from "@/components/atoms/Input"
import Button from "@/components/atoms/Button"

const RecurringTaskModal = ({ isOpen, onClose, onSave, initialData = {} }) => {
  // Ensure initialData is always an object to prevent null reference errors
  const safeInitialData = initialData || {}
const [pattern, setPattern] = useState(safeInitialData.pattern || "daily")
  const [frequency, setFrequency] = useState(safeInitialData.frequency || 1)
  const [startDate, setStartDate] = useState(
    safeInitialData.startDate || new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(safeInitialData.endDate || "")
  const [selectedDays, setSelectedDays] = useState(safeInitialData.selectedDays || [])
  const [monthlyType, setMonthlyType] = useState(safeInitialData.monthlyType || "date")
  const [customInterval, setCustomInterval] = useState(safeInitialData.customInterval || 1)
  const [customUnit, setCustomUnit] = useState(safeInitialData.customUnit || "days")

  const weekDays = [
    { key: "monday", label: "Mon" },
    { key: "tuesday", label: "Tue" },
    { key: "wednesday", label: "Wed" },
    { key: "thursday", label: "Thu" },
    { key: "friday", label: "Fri" },
    { key: "saturday", label: "Sat" },
    { key: "sunday", label: "Sun" }
  ]

  const handleDayToggle = (day) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const handleSave = () => {
    const recurringData = {
      pattern,
      frequency,
      startDate,
      endDate: endDate || null,
      selectedDays: pattern === "weekly" ? selectedDays : [],
      monthlyType: pattern === "monthly" ? monthlyType : null,
      customInterval: pattern === "custom" ? customInterval : null,
      customUnit: pattern === "custom" ? customUnit : null
    }
    onSave(recurringData)
    onClose()
  }

  const getFrequencyLabel = () => {
    switch (pattern) {
      case "daily": return frequency === 1 ? "day" : "days"
      case "weekly": return frequency === 1 ? "week" : "weeks"
      case "monthly": return frequency === 1 ? "month" : "months"
      default: return ""
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recurring Task</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <ApperIcon name="X" size={20} />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Pattern Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Repeat Pattern
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["daily", "weekly", "monthly", "custom"].map((patternType) => (
                  <button
                    key={patternType}
                    type="button"
                    onClick={() => setPattern(patternType)}
                    className={`p-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      pattern === patternType
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {patternType}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            {pattern !== "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Every {frequency} {getFrequencyLabel()}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Every</span>
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    value={frequency}
                    onChange={(e) => setFrequency(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-gray-600">{getFrequencyLabel()}</span>
                </div>
              </div>
            )}

            {/* Weekly Days Selection */}
            {pattern === "weekly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  On these days
                </label>
                <div className="flex gap-2 flex-wrap">
                  {weekDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => handleDayToggle(day.key)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                        selectedDays.includes(day.key)
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Options */}
            {pattern === "monthly" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Monthly repeat type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="monthlyType"
                      value="date"
                      checked={monthlyType === "date"}
                      onChange={(e) => setMonthlyType(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">On the same date each month</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="monthlyType"
                      value="day"
                      checked={monthlyType === "day"}
                      onChange={(e) => setMonthlyType(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">On the same day of the month</span>
                  </label>
                </div>
              </div>
            )}

            {/* Custom Pattern */}
            {pattern === "custom" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Interval
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Every</span>
                  <Input
                    type="number"
                    min="1"
                    value={customInterval}
                    onChange={(e) => setCustomInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center"
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
            )}

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Range
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    End Date (optional)
                  </label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="ghost"
              onClick={onClose}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="px-6"
              disabled={pattern === "weekly" && selectedDays.length === 0}
            >
              <ApperIcon name="Check" size={16} className="mr-2" />
              Save Pattern
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default RecurringTaskModal