// manager-ui/components/EditProduct/ProductReviews.js
export default function ProductReviews({ reviews, handleUpdateModerationStatus }) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Product Reviews</h2>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 shadow-md">
                <h3 className="text-lg font-semibold text-gray-800">{review.user.name || 'Anonymous'}</h3>
                <p className="text-sm text-gray-500">Rating: {review.rating} ⭐</p>
                <p className="text-sm text-gray-700 mt-2">{review.content}</p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Moderation Status</label>
                  <div className="flex space-x-4">
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="0"
                        checked={review.moderationStatus === '0'}
                        onChange={() => handleUpdateModerationStatus(review.id, '0')}
                        className="sr-only"
                      />
                      <div className={`w-24 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '0' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Approved
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="1"
                        checked={review.moderationStatus === '1'}
                        onChange={() => handleUpdateModerationStatus(review.id, '1')}
                        className="sr-only"
                      />
                      <div className={`w-24 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '1' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Denied
                      </div>
                    </label>
                    <label className="cursor-pointer">
                      <input
                        type="radio"
                        name={`moderationStatus-${review.id}`}
                        value="2"
                        checked={review.moderationStatus === '2'}
                        onChange={() => handleUpdateModerationStatus(review.id, '2')}
                        className="sr-only"
                      />
                      <div className={`w-32 h-8 flex items-center justify-center font-semibold ${review.moderationStatus === '2' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-600'} rounded-full`}>
                        Pending
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No reviews found for this product.</p>
        )}
      </div>
    );
  }
  