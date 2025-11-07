import { useState, useEffect, TouchEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { logError } from '../utils/logError';
import { useCart } from '../context/CartContext';

// It's good practice to define the API URL at the top level
const apiUrl = import.meta.env.VITE_API_URL;

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentImage, setCurrentImage] = useState(0);
    const [fullscreen, setFullscreen] = useState(false);
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    // --- All Logic and Data Fetching (Unchanged) ---
    const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => { setTouchEnd(e.targetTouches[0].clientX); };
    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const images = product?.imageUrl || [];
        if (distance > minSwipeDistance && images.length > 1) {
            setCurrentImage((prev) => (prev + 1) % images.length);
        } else if (distance < -minSwipeDistance && images.length > 1) {
            setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
        }
        setTouchStart(null); setTouchEnd(null);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) { setError("Product ID is missing."); setLoading(false); return; }
            try {
                setLoading(true);
                const response = await fetch(`${apiUrl}/api/products/${productId}`);
                if (!response.ok) {
                    if (response.status === 404) throw new Error('Product not found.');
                    throw new Error('Failed to fetch product details.');
                }
                const data: Product = await response.json();
                setProduct(data);
                setCurrentImage(0);
            } catch (err: any) {
                setError(err.message || 'An unexpected error occurred.');
                logError('Fetching product details failed', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    useEffect(() => {
        const fetchRelatedProducts = async () => {
            if (!product?.category) return;
            try {
                const response = await fetch(`${apiUrl}/api/products/category/${product.category}`);
                if (response.ok) {
                    const data: Product[] = await response.json();
                    const filtered = data.filter((p) => p._id !== product._id);
                    setRelatedProducts(filtered.slice(0, 10));
                }
            } catch (err) { console.error("Related product fetch failed:", err); }
        };
        if (product) { fetchRelatedProducts(); }
    }, [product]);

    const handleBuyNow = () => {
        if (!product) return;
        addToCart(product);
        navigate('/checkout');
    };

    // --- UI Components ---
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-slate-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h2 className="mt-4 text-2xl font-semibold text-gray-700">Loading Product...</h2>
            </div>
        </div>
    );

    if (error) return (
        <div className="text-center py-20 px-4">
            <h2 className="text-3xl font-bold text-red-600">Error: {error}</h2>
            <p className="text-gray-600 mt-4 max-w-md mx-auto">We couldn't load the product details. Please try again later or return to the homepage.</p>
            <Link to="/" className="mt-6 inline-block bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg">Back to Homepage</Link>
        </div>
    );

    if (!product) return (
        <div className="text-center py-20 px-4">
            <h2 className="text-3xl font-bold text-gray-800">Product Not Found</h2>
            <p className="text-gray-600 mt-4">The item you are looking for does not exist or has been removed.</p>
            <Link to="/" className="mt-6 inline-block bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 transition-all shadow-md hover:shadow-lg">Browse All Items</Link>
        </div>
    );

    const images = product.imageUrl || [];
    const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

    return (
        <>
            <div className="bg-gray-50 min-h-screen">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl p-6 lg:p-12">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Image Gallery */}
                            <div className="flex flex-col md:flex-row-reverse gap-4">
                                <div className="relative w-full aspect-square bg-gray-100 rounded-xl overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                                    <img src={images[currentImage]} alt={`${product.title} - Image ${currentImage + 1}`} onClick={() => setFullscreen(true)} className="w-full h-full object-contain cursor-zoom-in transition-transform duration-300 ease-in-out hover:scale-105" />
                                    {images.length > 1 && (
                                        <>
                                            <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-white transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                            <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/70 backdrop-blur-sm text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md hover:bg-white transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                                        </>
                                    )}
                                </div>
                                {images.length > 1 && (
                                    <>
                                        <div className="hidden md:flex flex-col gap-3">{images.map((img, idx) => (<img key={idx} src={img} onClick={() => setCurrentImage(idx)} alt={`Thumbnail ${idx + 1}`} className={`w-20 h-20 object-cover rounded-lg border-2 cursor-pointer transition-all duration-200 ${idx === currentImage ? "border-slate-700 scale-105 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"}`} />))}</div>
                                        <div className="md:hidden flex justify-center gap-2 p-2">{images.map((img, idx) => (<img key={idx} src={img} onClick={() => setCurrentImage(idx)} alt={`Thumbnail ${idx + 1}`} className={`w-16 h-16 object-cover rounded-md border-2 cursor-pointer transition ${idx === currentImage ? "border-slate-700 scale-105" : "border-gray-200 opacity-60 hover:opacity-100"}`} />))}</div>
                                    </>
                                )}
                            </div>

                            {/* Product Info */}
                            <div className="flex flex-col">
                                <div>
                                    <div className="mb-4"><Link to={`/category/${product.category}`} className="text-sm font-medium text-slate-600 hover:underline">{product.category}</Link></div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">{product.title}</h1>
                                    <p className="text-4xl font-bold text-slate-800 mb-6">₹{product.price.toLocaleString("en-IN")}</p>
                                    <div className="prose prose-slate max-w-none mb-8">
                                        <p className="text-lg font-semibold mb-2 text-slate-700">Description:</p>
                                        <p>{product.description}</p>
                                    </div>
                                    <div className="text-sm text-slate-500">Posted on {new Date(product.postDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                                {/* <div className="mt-auto pt-8 hidden md:flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => addToCart(product)} className="flex-1 flex items-center justify-center gap-2 border border-slate-300 text-slate-800 py-3 px-6 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                        Add to Cart
                                    </button>
                                    <button onClick={handleBuyNow} className="flex-1 bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-800 transition-all duration-300 transform hover:scale-105 shadow-md">
                                        Buy Now
                                    </button>
                                </div> */}
                                <div className="mt-auto pt-8 hidden md:flex flex-col sm:flex-row gap-4">
                                    {product.isBooked ? (
                                        <>
                                            <button
                                                disabled
                                                className="flex-1 py-3 px-6 rounded-lg font-semibold text-white bg-gray-400 cursor-not-allowed opacity-80"
                                            >
                                                Sold Out
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                        <button
                                            onClick={() => addToCart(product)}
                                            className="flex-1 flex items-center justify-center gap-2 border border-slate-300 text-slate-800 py-3 px-6 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Add to Cart
                                        </button>

                                        <button
                                            onClick={handleBuyNow}
                                            className="flex-1 bg-slate-700 text-white py-3 px-6 rounded-lg font-semibold hover:bg-slate-800 transition-all duration-300 transform hover:scale-105 shadow-md"
                                        >
                                            Buy Now
                                        </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Related Products Section */}
                    {relatedProducts.length > 0 && (
                        <section className="mt-16">
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center lg:text-left">You Might Also Like</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {relatedProducts.map((item) => (
                                    <Link key={item._id} to={`/product/${item._id}`} className="group bg-white p-4 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                        <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100"><img src={item.imageUrl[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={item.title} /></div>
                                        <h3 className="mt-4 text-sm font-semibold text-slate-800 line-clamp-2">{item.title}</h3>
                                        <p className="mt-1 text-base font-bold text-slate-900">₹{item.price.toLocaleString("en-IN")}</p>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            {/* Fullscreen Modal */}
            {fullscreen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 animate-fade-in" onClick={() => setFullscreen(false)}>
                    <button className="absolute top-4 right-4 text-white/80 hover:text-white transition" onClick={() => setFullscreen(false)}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    {images.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/30 transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-white/30 transition"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                        </>
                    )}
                    <img src={images[currentImage]} className="max-w-[90vw] max-h-[90vh] object-contain cursor-zoom-out" alt={`Fullscreen view of ${product.title}`} />
                </div>
            )}

            {/* Sticky Mobile Action Bar */}
            {/* <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-3 flex gap-3 md:hidden z-40 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                <button onClick={() => addToCart(product)} className="flex-1 flex items-center justify-center gap-2 border border-slate-300 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-100 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    Add to Cart
                </button>
                <button onClick={handleBuyNow} className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors">
                    Buy Now
                </button>
            </div> */}
            <div className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-3 flex gap-3 md:hidden z-40 border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                {product.isBooked ? (
                    <button
                    disabled
                    className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-semibold cursor-not-allowed opacity-80"
                    >
                    Sold Out
                    </button>
                ) : (
                    <>
                    <button
                        onClick={() => addToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 border border-slate-300 text-slate-800 py-3 px-4 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Add to Cart
                    </button>
                    <button
                        onClick={handleBuyNow}
                        className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                    >
                        Buy Now
                    </button>
                    </>
                )}
            </div>
        </>
    );
};

export default ProductDetail;
