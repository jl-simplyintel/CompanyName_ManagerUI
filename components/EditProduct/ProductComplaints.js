// manager-ui/components/EditProduct/ProductComplaints.js
export default function ProductComplaints({ complaints, handleToggleComplaintStatus }) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Product Complaints</h2>
        {complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="border rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{complaint.user.name || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">Subject: {complaint.subject}</p>
                <p className="text-sm text-gray-700 mt-2">{complaint.content}</p>
  
                {/* Toggle switch for complaint status */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Status</label>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={complaint.status === '0'}
                        onChange={() => handleToggleComplaintStatus(complaint.id, complaint.status === '0' ? '1' : '0')}
                        className="sr-only peer"
                      />
                      <div className={`w-12 h-6 bg-gray-200 rounded-full peer peer-checked:bg-green-600 peer-focus:ring-4 peer-focus:ring-green-300 transition duration-200 ease-in-out`}></div>
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white border border-gray-300 rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-full"></div>
                    </label>
                    <span className="ml-3 text-sm text-gray-600">{complaint.status === '0' ? 'Resolved' : 'Unresolved'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No complaints found for this product.</p>
        )}
      </div>
    );
  }
  