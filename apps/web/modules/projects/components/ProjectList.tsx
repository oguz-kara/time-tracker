'use client';

import Link from 'next/link';
import { ProjectCard } from './ProjectCard';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ProjectListProps {
  projects: Project[];
  onDelete: (id: string) => void | Promise<void>;
}

/**
 * ProjectList Component
 * Displays a grid of project cards
 */
export function ProjectList({ projects, onDelete }: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="max-w-md space-y-4">
          <h3 className="text-2xl font-semibold text-foreground">No projects yet</h3>
          <p className="text-muted-foreground">
            Get started by creating your first project. Projects help you organize your work
            and collaborate with your team.
          </p>
          <Button render={<Link href="/projects/new" />}>Create Your First Project</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onDelete={onDelete} />
      ))}
    </div>
  );
}
