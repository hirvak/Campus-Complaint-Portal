import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { PlusSquare, ArrowLeft, AlertCircle, CheckCircle2, Info, ArrowRight } from 'lucide-react';

export function CreateComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getRolePrefix = () => {
    switch (user?.role) {
      case 'Student': return '/student';
      case 'Faculty': return '/faculty';
      default: return '';
    }
  };

  const rolePrefix = getRolePrefix();

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, depts] = await Promise.all([
          api.categories.getAll(),
          api.departments.getAll(),
        ]);
        setCategories(cats);

        const dMap = {};
        depts.forEach((d) => (dMap[d.id] = d.name));
        setDepartmentsMap(dMap);
      } catch (err) {
        setErrorMessage('Failed to load complaint categories.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadData();
  }, []);

  const selectedCategoryObj = categories.find((c) => String(c.id) === String(categoryId));
  const autoMappedDeptName = selectedCategoryObj
    ? departmentsMap[selectedCategoryObj.department_id] || `Department #${selectedCategoryObj.department_id}`
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage('Title must be at least 3 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMessage('Description must be at least 5 characters.');
      return;
    }
    if (!categoryId) {
      setErrorMessage('Please select a complaint category.');
      return;
    }
    if (!location.trim() || location.trim().length < 2) {
      setErrorMessage('Location is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.complaints.create({
        title: title.trim(),
        description: description.trim(),
        category_id: Number(categoryId),
        location: location.trim(),
        image_url: imageUrl.trim() || null,
      });

      setSuccessMessage('Complaint created successfully! Routing to department...');
      setTimeout(() => {
        navigate(`${rolePrefix}/complaints`);
      }, 1500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-3xl mx-auto space-y-6 text-left">
        
        {/* TOP HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex items-center justify-between shadow-2xs">
          <div>
            <Link to={`${rolePrefix}/dashboard`} className="text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] inline-flex items-center gap-1 mb-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              REPORT A CAMPUS ISSUE
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Tell us what needs attention. Your request will be routed automatically.
            </p>
          </div>
        </div>

        {/* MAIN FORM WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 sm:p-8 text-left space-y-6 shadow-2xs">
          
          {/* Automated Department Mapping Note */}
          <div className="bg-[#FDF2F4] dark:bg-[#C51F3D]/15 border border-[#F8D7DA] dark:border-[#C51F3D]/30 text-[#94102A] dark:text-[#F8FAFC] p-3.5 rounded-[8px] text-xs flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D] shrink-0 mt-0.5" />
            <span>
              <strong className="text-[#B51232] dark:text-[#C51F3D]">Automated Department Routing:</strong> Department assignment is automatically resolved by the system based on your selected category (e.g. WiFi → IT Department). You do not need to manually select a department.
            </span>
          </div>

          {/* Error / Success Alerts */}
          {errorMessage && (
            <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] p-4 rounded-[8px] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-[#E8F5EC] dark:bg-[#22A06B]/15 border border-[#A7F3D0] dark:border-[#22A06B]/30 text-[#008A4A] dark:text-[#22A06B] p-4 rounded-[8px] text-xs flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1.5">
                Complaint Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Broken projector in Room 302"
                className="w-full text-sm p-3 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1.5">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full text-sm p-3 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.description ? `(${c.description})` : ''}
                  </option>
                ))}
              </select>

              {/* Dynamic Auto-Mapped Department Indication */}
              {selectedCategoryObj && autoMappedDeptName && (
                <div className="mt-2 text-xs text-[#10213A] dark:text-[#F8FAFC] bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-2.5 rounded-[6px] flex items-center gap-2">
                  <span className="font-bold text-[#B51232] dark:text-[#C51F3D]">{selectedCategoryObj.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#60708A] dark:text-[#AEB9C9]" />
                  <span className="font-semibold">{autoMappedDeptName}</span>
                </div>
              )}
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1.5">
                Location / Room / Building *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Block B, 2nd Floor, Room 204 or Hostel Block C"
                className="w-full text-sm p-3 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1.5">
                Detailed Description *
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed description of the problem..."
                className="w-full text-sm p-3 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
              />
            </div>

            {/* Image URL (Optional) */}
            <div>
              <label className="block text-xs font-label uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1.5">
                Image URL (Optional)
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="w-full text-sm p-3 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
              />
            </div>

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-3 border-t border-[#DED8CC] dark:border-[#344155]">
              <Button type="submit" variant="primary" size="lg" isLoading={submitting}>
                <PlusSquare className="w-4 h-4 mr-2" />
                Submit Complaint
              </Button>
              <Link to={`${rolePrefix}/dashboard`}>
                <Button variant="secondary" size="lg">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

export default CreateComplaint;
