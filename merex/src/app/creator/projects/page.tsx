"use client";

import { useEffect, useState } from "react";
import { PagePanel, PageScaffold } from "@/components/ui/PageScaffold";

type Project = {
  id: string;
  status: string;
  requirement: { title: string };
  deliverables: { id: string; status: string; submittedAt: string }[];
};

export default function CreatorProjectsPage() {
  const [items, setItems] = useState<Project[]>([]);

  useEffect(() => {
    (async () => {
      const response = await fetch("/api/creator/projects");
      if (response.status === 412) {
        window.location.assign("/creator/connect-instagram");
        return;
      }
      const result = await response.json();
      setItems(result.data ?? []);
    })();
  }, []);

  return (
    <PageScaffold eyebrow="Creator" title="Projects" description="View ongoing and completed creator work.">
      <PagePanel className="list">
        {items.length === 0 ? <p className="help">No active projects yet.</p> : null}
        {items.map((project) => (
          <article className="focus-surface p-4" key={project.id}>
            <div className="item-head">
              <h3 className="item-title">{project.requirement.title}</h3>
              <span className={`status ${project.status.toLowerCase()}`}>{project.status}</span>
            </div>
            <p className="muted">Deliverables: {project.deliverables.length}</p>
            <p className="muted">
              Latest update:{" "}
              {project.deliverables[0]
                ? new Date(project.deliverables[0].submittedAt).toLocaleString()
                : "No deliverables yet"}
            </p>
          </article>
        ))}
      </PagePanel>
    </PageScaffold>
  );
}
