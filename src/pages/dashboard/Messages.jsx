import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from '../../components/ui/Button.jsx';
import { clients, messageTemplates } from '../../data/mockData.js';
import { createWhatsAppLink } from '../../utils/whatsapp.js';

const templateFallbacks = {
  serviceName: 'Gel Polish',
  date: 'tomorrow',
  time: '15:00',
};

function fillTemplate(content, client, businessName) {
  return content
    .replaceAll('{{clientName}}', client.name)
    .replaceAll('{clientName}', client.name)
    .replaceAll('{{businessName}}', businessName)
    .replaceAll('{businessName}', businessName)
    .replaceAll('{{serviceName}}', templateFallbacks.serviceName)
    .replaceAll('{serviceName}', templateFallbacks.serviceName)
    .replaceAll('{{date}}', templateFallbacks.date)
    .replaceAll('{date}', templateFallbacks.date)
    .replaceAll('{{time}}', templateFallbacks.time)
    .replaceAll('{time}', templateFallbacks.time);
}

function openWhatsApp(phone, message) {
  window.open(createWhatsAppLink(phone, message), '_blank', 'noopener,noreferrer');
}

function Messages() {
  const { businessProfile } = useOutletContext();
  const businessName = businessProfile.business_name;
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const selectedClient =
    clients.find((client) => client.id === selectedClientId) || clients[0];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-950">Messages</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Send quick WhatsApp messages from saved salon templates.
          </p>
        </div>

        <label className="block sm:min-w-72">
          <span className="text-sm font-medium text-neutral-700">Choose client</span>
          <select
            value={selectedClientId}
            onChange={(event) => setSelectedClientId(event.target.value)}
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-100"
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name} · {client.phone}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-3xl border border-neutral-200 bg-rose-50/70 p-5 shadow-sm">
        <p className="text-sm font-medium text-rose-700">Selected client</p>
        <p className="mt-2 text-lg font-semibold text-neutral-950">{selectedClient.name}</p>
        <p className="mt-1 text-sm text-neutral-600">{selectedClient.phone}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {messageTemplates.map((template) => {
          const message = fillTemplate(template.content, selectedClient, businessName);

          return (
            <article
              key={template.id}
              className="flex flex-col rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-950">{template.name}</h3>
                  <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium capitalize text-neutral-700">
                    {template.type}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex-1 rounded-2xl bg-neutral-50 p-4">
                <p className="text-sm leading-6 text-neutral-700">{message}</p>
              </div>

              <Button
                className="mt-5 w-full"
                onClick={() => openWhatsApp(selectedClient.phone, message)}
              >
                Send WhatsApp
              </Button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default Messages;
