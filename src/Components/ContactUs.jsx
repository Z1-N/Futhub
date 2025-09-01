import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';

const ContactUs = () => {
  const initialValues = {
    name: '',
    email: '',
    message: '',
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    message: Yup.string().required('Message is required'),
  });

  const onSubmit = async (values, { setSubmitting, resetForm, setStatus }) => {
    // Simulate async request
    try {
      setStatus(undefined);
      await new Promise((r) => setTimeout(r, 900));
      // Here you could POST to your API endpoint
      // await axios.post('/api/contact', values)
      setStatus({ ok: true, message: 'Thanks! Your message has been sent.' });
      resetForm();
    } catch (e) {
      setStatus({ ok: false, message: 'Sorry, something went wrong. Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur shadow-sm max-w-lg w-full mx-4"
      >
        <div className="p-5 md:p-7 text-gray-900 dark:text-white">
          <div className="text-center mb-2 md:mb-3">
            <h1 className="text-2xl md:text-3xl font-anton bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Contact Us</h1>
            <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 mt-1">We’d love to hear your feedback, feature ideas, or bug reports.</p>
          </div>

          <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
            {({ isSubmitting, values, errors, touched, status }) => (
              <Form className="space-y-4 md:space-y-5">
                {status?.message && (
                  <div className={`rounded-lg p-3 text-sm ${status.ok ? 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30'}`}>
                    {status.message}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative`}> 
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{/* user icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.75 20.1a8.25 8.25 0 0116.5 0 .9.9 0 01-.9.9H4.65a.9.9 0 01-.9-.9z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <Field
                      id="name"
                      type="text"
                      name="name"
                      aria-invalid={Boolean(touched.name && errors.name)}
                      aria-describedby="name-error"
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border bg-white/70 dark:bg-gray-900/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-700`}
                      placeholder="Your name"
                    />
                  </div>
                  <ErrorMessage id="name-error" name="name" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{/* mail icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M1.5 6.75A2.25 2.25 0 013.75 4.5h16.5a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0120.25 19.5H3.75A2.25 2.25 0 011.5 17.25V6.75z" />
                        <path d="M22.5 6.75l-9 6-9-6" />
                      </svg>
                    </span>
                    <Field
                      id="email"
                      type="email"
                      name="email"
                      aria-invalid={Boolean(touched.email && errors.email)}
                      aria-describedby="email-error"
                      className="w-full pl-10 pr-3 py-2 rounded-lg border bg-white/70 dark:bg-gray-900/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-700"
                      placeholder="you@example.com"
                    />
                  </div>
                  <ErrorMessage id="email-error" name="email" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      as="textarea"
                      id="message"
                      name="message"
                      rows="4"
                      maxLength={500}
                      aria-invalid={Boolean(touched.message && errors.message)}
                      aria-describedby="message-error message-help"
                      className="w-full resize-y min-h-[120px] pr-10 pl-3 py-2 rounded-lg border bg-white/70 dark:bg-gray-900/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-700"
                      placeholder="Tell us how we can help…"
                    />
                    <div className="absolute right-2 bottom-2 text-[11px] text-gray-500 dark:text-gray-400">{values.message.length}/500</div>
                  </div>
                  <p id="message-help" className="text-[11px] text-gray-500 mt-1">Max 500 characters.</p>
                  <ErrorMessage id="message-error" name="message" component="div" className="text-red-500 text-xs mt-1" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full inline-flex items-center justify-center gap-2 font-anton rounded-lg px-4 py-2.5 transition-colors border text-white ${isSubmitting ? 'bg-indigo-400/60 cursor-not-allowed border-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600'}`}
                >
                  {isSubmitting && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                  <span>{isSubmitting ? 'Sending…' : 'Send Message'}</span>
                </button>

                <div className="text-center text-xs text-gray-600 dark:text-gray-400">
                  Prefer email? <a className="text-indigo-600 dark:text-indigo-400 hover:underline" href="mailto:hello@futhub.app">hello@futhub.app</a>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactUs;