from tortoise import fields
from tortoise.models import Model

class Explanation(Model):
  id = fields.UUIDField(pk=True)
  text = fields.CharField(max_length=255)
  overview = fields.TextField(null=False)
  created_at = fields.DatetimeField(auto_now_add=True)
  chapters = fields.ReverseRelation["Chapter"]

  class Meta:
    table = "explanations"
  
class Chapter(Model):
    id = fields.UUIDField(pk=True)
    parent = fields.ForeignKeyField(
        "models.Explanation", related_name="chapters", on_delete=fields.CASCADE
    )
    title = fields.CharField(max_length=255)
    status = fields.CharField(max_length=20, default="pending")  # pending, building, completed
    contents = fields.ReverseRelation["Content"]

    class Meta:
        table = "chapters"
        
class Content(Model):
    id = fields.UUIDField(pk=True)
    chapter = fields.ForeignKeyField(
      "models.Chapter", related_name="contents", on_delete=fields.CASCADE
      )
    content_type = fields.CharField(max_length=50)  # e.g., 'text', 'image', 'code'
    value = fields.TextField()
    

    class Meta:
        table = "contents"
