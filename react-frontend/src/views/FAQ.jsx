import { useNavigate } from "react-router-dom";

export default function FAQ() {
  const navigate = useNavigate();
  return (
    <>
    <div
      className="relative w-full bg-white px-6 pt-10 pb-8 my-8 shadow-xl ring-1 ring-gray-900/5 sm:mx-auto sm:max-w-2xl sm:rounded-lg sm:px-10">
      <div className="mx-auto px-5">
        <div className="flex flex-col items-center">
          <h2 className="mt-5 text-center text-3xl font-bold tracking-tight md:text-5xl">FAQ</h2>
          <p className="mt-3 text-lg text-neutral-500 md:text-xl">Preguntas frecuentes</p>
          <button className="mt-4 text-center font-semibold px-5 py-2 border rounded-2xl" onClick={() => navigate(-1)}>Volver</button>

        </div>
        <div className="mx-auto mt-8 grid max-w-xl divide-y divide-neutral-200">
          <div className="py-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span> ¿Cómo funciona el servicio?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision"
                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="group-open:animate-fadeIn mt-3 text-neutral-600">Springerdata offers a variety of
                billing options, including monthly and annual subscription plans, as well as pay-as-you-go
                pricing for certain services. Payment is typically made through a credit card or other
                secure online payment method.
              </p>
            </details>
          </div>
          <div className="py-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span> ¿Puedo obtener un reembolso o cancelar mi suscripción?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision"
                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="group-open:animate-fadeIn mt-3 text-neutral-600">We offer a 30-day money-back
                guarantee for most of its subscription plans. If you are not satisfied with your
                subscription within the first 30 days, you can request a full refund. Refunds for
                subscriptions that have been active for longer than 30 days may be considered on a
                case-by-case basis.
              </p>
            </details>
          </div>
          <div className="py-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span> ¿Qué sucede con la información que entrego a esta plataforma?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision"
                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="group-open:animate-fadeIn mt-3 text-neutral-600">To cancel your subscription, you can
                log in to your account and navigate to the subscription management page. From there, you
                should be able to cancel your subscription and stop future billing.
              </p>
            </details>
          </div>
          <div className="py-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span> ¿Hay una prueba gratis?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision"
                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="group-open:animate-fadeIn mt-3 text-neutral-600">We offer a free trial of our software
                for a limited time. During the trial period, you will have access to a limited set of
                features and functionality, but you will not be charged.
              </p>
            </details>
          </div>
          <div className="py-5">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                <span> ¿?</span>
                <span className="transition group-open:rotate-180">
                  <svg fill="none" height="24" shapeRendering="geometricPrecision"
                    stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"
                    strokeWidth="1.5" viewBox="0 0 24 24" width="24">
                    <path d="M6 9l6 6 6-6"></path>
                  </svg>
                </span>
              </summary>
              <p className="group-open:animate-fadeIn mt-3 text-neutral-600">If you need help with our platform or
                have any other questions, you can contact the company's support team by submitting a support
                request through the website or by emailing support@ourwebsite.com.
              </p>
            </details>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}