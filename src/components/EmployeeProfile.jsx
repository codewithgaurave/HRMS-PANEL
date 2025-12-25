// src/components/EmployeeProfile.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTheme } from '../context/ThemeContext';
import employeeAPI from '../apis/employeeAPI';
import departmentAPI from '../apis/departmentAPI';
import designationAPI from '../apis/designationAPI';
import employmentStatusAPI from '../apis/employmentStatusAPI';
import officeLocationAPI from '../apis/officeLocationAPI';
import workShiftAPI from '../apis/workShiftAPI';

// Section Components
import BasicInfoSection from './employeeProfile/BasicInfoSection';
import AddressSection from './employeeProfile/AddressSection';
import EmploymentDetailsSection from './employeeProfile/EmploymentDetailsSection';
import BankDetailsSection from './employeeProfile/BankDetailsSection';
import DocumentsSection from './employeeProfile/DocumentsSection';
import EmergencyContactSection from './employeeProfile/EmergencyContactSection';
import PersonalInfoSection from './employeeProfile/PersonalInfoSection';
import EmployeeAttendanceDetails from './employeeProfile/EmployeeAttendanceDetails';

const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState('basic-info');
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  // Master data states
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [employmentStatuses, setEmploymentStatuses] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [workShifts, setWorkShifts] = useState([]);
  const [managers, setManagers] = useState([]);

  // Fetch employee data
  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await employeeAPI.getById(id);
      setEmployee(response.data.employee);
    } catch (err) {
      console.error('Error fetching employee:', err);
      toast.error('Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all master data
  const fetchMasterData = async () => {
    try {
      const [
        deptResponse,
        desigResponse,
        statusResponse,
        locationResponse,
        shiftResponse,
        managersResponse
      ] = await Promise.all([
        departmentAPI.getAll({ limit: 100 }),
        designationAPI.getAll({ limit: 100 }),
        employmentStatusAPI.getAll({ limit: 100 }),
        officeLocationAPI.getAll(),
        workShiftAPI.getAllWithoutFilters(),
        employeeAPI.getManagers()
      ]);

      setDepartments(deptResponse.data.departments || []);
      setDesignations(desigResponse.data.designations || []);
      setEmploymentStatuses(statusResponse.data.employmentStatuses || []);
      setOfficeLocations(locationResponse.data.officeLocations || []);
      setWorkShifts(shiftResponse.data || []);
      setManagers(managersResponse.data.managers || []);
    } catch (err) {
      console.error('Error fetching master data:', err);
      toast.error('Failed to load some reference data');
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchMasterData();
  }, [id]);

  // Handle section updates
  const handleSectionUpdate = async (section, data) => {
    try {
      let response;
      switch (section) {
        case 'basic-info':
          response = await employeeAPI.updateBasicInfo(id, data);
          break;
        case 'address':
          response = await employeeAPI.updateAddress(id, data);
          break;
        case 'employment-details':
          response = await employeeAPI.updateEmploymentDetails(id, data);
          break;
        case 'bank-details':
          response = await employeeAPI.updateBankDetails(id, data);
          break;
        case 'documents':
          response = await employeeAPI.updateDocuments(id, data);
          break;
        case 'emergency-contact':
          response = await employeeAPI.updateEmergencyContact(id, data);
          break;
        case 'personal-info':
          response = await employeeAPI.updatePersonalInfo(id, data);
          break;
        default:
          throw new Error('Invalid section');
      }

      setEmployee(response.data.employee);
      toast.success(`${section.replace('-', ' ')} updated successfully!`);
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.response?.data?.message || `Failed to update ${section}`);
    }
  };

  // Navigation tabs
  const tabs = [
    { id: 'attendance', name: 'Attendance', icon: '📊' }, // Add this line
    { id: 'basic-info', name: 'Basic Information', icon: '👤' },
    { id: 'address', name: 'Address', icon: '🏠' },
    { id: 'employment-details', name: 'Employment', icon: '💼' },
    { id: 'bank-details', name: 'Bank Details', icon: '🏦' },
    { id: 'documents', name: 'Documents', icon: '📄' },
    { id: 'emergency-contact', name: 'Emergency Contact', icon: '🚨' },
    { id: 'personal-info', name: 'Personal Info', icon: '🔒' },
  ];

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: themeColors.background, color: themeColors.text }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: themeColors.primary }}
          ></div>
          <p className="mt-4" style={{ color: themeColors.textSecondary }}>
            Loading employee data...
          </p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: themeColors.background, color: themeColors.text }}
      >
        <div className="text-center">
          <div className="text-xl mb-4" style={{ color: themeColors.danger }}>
            Employee Not Found
          </div>
          <p className="mb-4" style={{ color: themeColors.textSecondary }}>
            The requested employee could not be found.
          </p>
          <button
            onClick={() => navigate('/employees')}
            className="px-6 py-2 rounded-lg font-medium text-white"
            style={{ backgroundColor: themeColors.primary }}
          >
            Back to Employees
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{ backgroundColor: themeColors.background, color: themeColors.text }}
    >
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">
                {employee?.name?.first} {employee?.name?.last}
              </h1>
              <p className="mt-2" style={{ color: themeColors.textSecondary }}>
                Employee ID: {employee?.employeeId} • {employee?.designation?.title}
                {employee?.isActive ? (
                  <span
                    className="ml-2 text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: themeColors.success + '20', color: themeColors.success }}
                  >
                    Active
                  </span>
                ) : (
                  <span
                    className="ml-2 text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: themeColors.danger + '20', color: themeColors.danger }}
                  >
                    Inactive
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/employees')}
              className="px-6 py-2 rounded-lg font-medium border transition-colors"
              style={{
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              Back
            </button>
          </div>
        </div>

        <div
          className="rounded-xl shadow-sm border overflow-hidden"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border
          }}
        >
          {/* Navigation Tabs */}
          <div style={{ borderColor: themeColors.border }}>
            <nav className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  style={{
                    borderBottomColor: activeTab === tab.id ? themeColors.primary : 'transparent',
                    color: activeTab === tab.id ? themeColors.primary : themeColors.textSecondary,
                    backgroundColor: activeTab === tab.id ? themeColors.primary + '10' : 'transparent'
                  }}
                >
                  <span className="mr-2 text-lg">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          
          <div className="p-6">

            {/* // In the tab content section, add: */}
            {activeTab === 'attendance' && (
              <EmployeeAttendanceDetails employee={employee} />
            )}

            {activeTab === 'basic-info' && (
              <BasicInfoSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('basic-info', data)}
              />
            )}

            {activeTab === 'address' && (
              <AddressSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('address', data)}
              />
            )}

            {activeTab === 'employment-details' && (
              <EmploymentDetailsSection
                employee={employee}
                departments={departments}
                designations={designations}
                employmentStatuses={employmentStatuses}
                officeLocations={officeLocations}
                workShifts={workShifts}
                managers={managers}
                onUpdate={(data) => handleSectionUpdate('employment-details', data)}
              />
            )}

            {activeTab === 'bank-details' && (
              <BankDetailsSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('bank-details', data)}
              />
            )}

            {activeTab === 'documents' && (
              <DocumentsSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('documents', data)}
              />
            )}

            {activeTab === 'emergency-contact' && (
              <EmergencyContactSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('emergency-contact', data)}
              />
            )}

            {activeTab === 'personal-info' && (
              <PersonalInfoSection
                employee={employee}
                onUpdate={(data) => handleSectionUpdate('personal-info', data)}
              />
            )}


          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;