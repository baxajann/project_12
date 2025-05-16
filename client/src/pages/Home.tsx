import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  MessageSquare, 
  Heart,
  Activity,
  User,
  Shield
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <header className="bg-primary text-primary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Heart className="h-8 w-8 mr-2" />
              <span className="font-bold text-2xl">HealthLink</span>
            </div>
            <div className="space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-white text-primary hover:bg-white/90">
                  Register
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="md:w-1/2">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
                  Connecting Doctors and Patients Seamlessly
                </h1>
                <p className="text-lg text-gray-700 mb-8">
                  HealthLink bridges the gap between healthcare professionals and patients with secure communication, health monitoring, and advanced disease prediction.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto">
                      Get Started
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Login to Your Account
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <img 
                  src="https://images.unsplash.com/photo-1576091160550-2173dba999ef" 
                  alt="Doctor consulting with patient" 
                  className="rounded-lg shadow-xl w-full h-auto"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<MessageSquare className="h-10 w-10 text-primary" />}
                title="Secure Messaging"
                description="Real-time chat between doctors and patients with end-to-end encryption for secure medical communication."
              />
              <FeatureCard 
                icon={<Activity className="h-10 w-10 text-primary" />}
                title="Disease Prediction"
                description="Advanced heart disease prediction using machine learning algorithms to provide early warnings."
              />
              <FeatureCard 
                icon={<Heart className="h-10 w-10 text-primary" />}
                title="Health Monitoring"
                description="Track vital health metrics over time with visual dashboards and trend analysis."
              />
              <FeatureCard 
                icon={<User className="h-10 w-10 text-primary" />}
                title="User Profiles"
                description="Comprehensive profiles for doctors and patients to manage medical information."
              />
              <FeatureCard 
                icon={<Shield className="h-10 w-10 text-primary" />}
                title="Data Security"
                description="Your medical data is securely stored and only accessible by authorized healthcare professionals."
              />
              <FeatureCard 
                icon={<Activity className="h-10 w-10 text-primary" />}
                title="Health Analytics"
                description="Visualize health data with charts and graphs to better understand medical trends."
              />
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Healthcare Experience?</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of doctors and patients who are already using HealthLink to improve healthcare delivery and outcomes.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                Create Your Account Today
              </Button>
            </Link>
          </div>
        </section>

        {/* Testimonials (Placeholder) */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <TestimonialCard 
                quote="HealthLink has transformed how I interact with my patients. The secure messaging and disease prediction tools have become essential to my practice."
                name="Dr. Sarah Chen"
                title="Cardiologist"
                imageUrl="https://images.unsplash.com/photo-1594824476967-48c8b964273f"
              />
              <TestimonialCard 
                quote="Being able to chat directly with my doctor and see my health data visualized has made managing my heart condition so much easier."
                name="Michael Rodriguez"
                title="Patient"
                imageUrl="https://images.unsplash.com/photo-1568602471122-7832951cc4c5"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Heart className="h-6 w-6 mr-2" />
                <span className="font-bold text-xl">HealthLink</span>
              </div>
              <p className="text-gray-400">
                Connecting healthcare professionals and patients for better outcomes.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">HIPAA Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-6 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} HealthLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

interface TestimonialCardProps {
  quote: string;
  name: string;
  title: string;
  imageUrl: string;
}

function TestimonialCard({ quote, name, title, imageUrl }: TestimonialCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-gray-700 mb-6 italic">"{quote}"</p>
      <div className="flex items-center">
        <img 
          src={imageUrl} 
          alt={name} 
          className="h-12 w-12 rounded-full object-cover mr-4"
        />
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-gray-600">{title}</p>
        </div>
      </div>
    </div>
  );
}
