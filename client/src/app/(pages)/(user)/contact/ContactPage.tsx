'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Smile, MapPin, Send } from 'lucide-react'
import CustomButton from '../../_components/CustomButton'

const greetings = [
  { text: "Hello!", lang: "English" },
  { text: "नमस्ते!", lang: "Hindi" },
  { text: "¡Hola!", lang: "Spanish" },
  { text: "Bonjour!", lang: "French" },
  { text: "Ciao!", lang: "Italian" },
  { text: "こんにちは!", lang: "Japanese" },
  { text: "안녕하세요!", lang: "Korean" },
  { text: "Hej!", lang: "Swedish" },
  { text: "Hallo!", lang: "German" },
  { text: "Olá!", lang: "Portuguese" }
]

export default function ContactPage() {
  const [isHovered, setIsHovered] = useState(false);
  const [currentGreeting, setCurrentGreeting] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentGreeting((prev) => (prev + 1) % greetings.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log(formData)
  }

  return (
    <div className="min-h-screen bg-white">
      <motion.section
        className="container mx-auto px-4 py-16 md:py-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Column */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
                Say
              </span>
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentGreeting}
                  className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {greetings[currentGreeting].text}
                  <span className="text-base font-normal text-gray-500">
                    ({greetings[currentGreeting].lang})
                  </span>
                </motion.h1>
              </AnimatePresence>
              <Smile className="w-8 h-8 md:w-12 md:h-12 " />
            </motion.div>

            {/* Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-xs md:text-sm  text-gray-600">
                We're here to help and answer any question you might have. we look forward to hearing from you. any need help you please contact us or meet to office with coffee.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Map Section */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-16 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="aspect-[16/9] md:aspect-[21/9] w-full relative  rounded-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14013.255277853348!2d77.04031040582618!3d28.590360911001277!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1bd8f405bcf1%3A0x9e601372145832d0!2sDesire%20Div%20-%20Website%20Designing%20Company%20in%20Dwarka!5e0!3m2!1sen!2sin!4v1736687419817!5m2!1sen!2sin"
              className="absolute inset-0 w-full h-full"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="absolute bottom-0 right-0 p-6 md:p-8 bg-white rounded-tl-2xl max-w-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Desire Div - Dwarka</h2>
            <p className="text-gray-600 mb-1">Website Designing Company</p>
            <p className="text-gray-600 mb-4">Dwarka, New Delhi, India</p>

            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-semibold">T:</span> +91 123 456 7890
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">E:</span> info@desirediv.com
              </p>
            </div>

            <motion.a
              href="https://www.google.com/maps?q=Desire+Div+-+Website+Designing+Company+in+Dwarka,+New+Delhi,+India"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-full mt-6 hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <MapPin className="w-4 h-4" />
              View on google map
            </motion.a>
          </div>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-12">
            How we can help you?
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR GOOD NAME*
                </label>
                <motion.input
                  type="text"
                  required
                  placeholder="What's your good name?"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0"
                  whileFocus={{ scale: 1.01 }}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR EMAIL ADDRESS*
                </label>
                <motion.input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0"
                  whileFocus={{ scale: 1.01 }}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR PHONE NUMBER*
                </label>
                <motion.input
                  type="tel"
                  required
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0"
                  whileFocus={{ scale: 1.01 }}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  YOUR SUBJECT
                </label>
                <motion.input
                  type="text"
                  placeholder="How can we help you?"
                  className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all border-t-0 border-l-0 border-r-0"
                  whileFocus={{ scale: 1.01 }}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                YOUR MESSAGE
              </label>
              <motion.textarea
                rows={6}
                placeholder="Describe about your message"
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none transition-all resize-none border-t-0 border-l-0 border-r-0"
                whileFocus={{ scale: 1.01 }}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <div className="flex items-center md:justify-between md:flex-row flex-col gap-4">
              <p className="text-sm text-gray-500 w-full md:w-1/2">
                We are committed to protecting your privacy. We will never collect information about you without your explicit consent.
              </p>

              <motion.button
                type="submit"
                className="inline-flex items-center gap-2 bg-gray-800 text-white px-8 py-4 rounded-full  transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
              >
                <Send className="w-4 h-4" />
                <AnimatePresence mode="wait">
                  {isHovered ? (
                    <motion.span
                      key="lets-talk"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      Let's Talk
                    </motion.span>
                  ) : (
                    <motion.span
                      key="send-message"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      Send message
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.section>
    </div>
  )
}

